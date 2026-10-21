// T4 relay bounds (RFC 0001, 6.7; guards R5, 6.1 A6, E1): an answer past responseBytes is cut,
// a hub that never answers is a 504 at the deadline with a `cancel` sent to it, the 33rd relay in
// flight is a 429, a hub closing mid-relay is a 502 (or a cut body), no hub socket a 503 at once.
// The hubs here are fakes that say exactly what each case needs; the real probe's own
// `err TOO_LARGE` is test/bridge's.
import {
	BRIDGE_LIMITS,
	RELAY_FAILURE_STATUS,
} from '../../../packages/contracts/dist/bridge.js'
import { waitFor } from '../../stream/stream-client.mjs'

import { delay, median } from './fakes/timing.mjs'
import { failureOf, readBody, relayGet } from './relay-client.mjs'
import { openHub } from './sockets.mjs'

const MIB = 1_048_576
const OVERSIZE_BYTES = 40 * MIB
const DEADLINE_SLACK_MS = 2000
const SAMPLES = 20
const WARM_UP = 3
const CANCEL_WAIT_MS = 5000
const ONE_MORE = 1

async function run(ctx) {
	const account = await ctx.account(0)
	await Promise.all([oversize(ctx, account), silent(ctx, account)])
	await tooMany(ctx, account)
	await hubErr(ctx, account)
	await dropping(ctx, account)
	await offline(ctx, account)
	ctx.printReads('T4', { from: null, to: null })
}

// A cut body reaches the tab as an error on a deployed Worker (the connection is reset). `wrangler
// dev`'s proxy ends any aborted stream with the normal chunked terminator - even a plain Worker's
// own errored stream, which test/web/cost/README.md shows - so locally only the short read shows.
function isCut(ctx, read, whole) {
	return read.bytes < whole && (read.error !== null || !ctx.staging)
}

function cutWord(ctx) {
	return ctx.staging
		? ' with an error'
		: ' (an error only on a deployed Worker)'
}

// 40 MiB: the object cuts at responseBytes, tells the hub to stop, and the tab's body is cut.
async function oversize(ctx, account) {
	const { report } = ctx
	const hub = await openHub(ctx, account, 0)
	const streams = []
	hub.handler = req => {
		streams.push(hub.streamAnswer(req.id, { bytes: OVERSIZE_BYTES }))
	}
	const startedAt = Date.now()
	const response = await relayGet(account, hub)
	const read = await readBody(response)
	const [sent] = await Promise.all(streams)
	report.check(
		`an answer of ${OVERSIZE_BYTES / MIB} MiB is cut: the tab's body stops short of it${cutWord(ctx)}`,
		response.status === 200 && isCut(ctx, read, OVERSIZE_BYTES),
		`status ${response.status}, ${read.bytes} bytes read, ${read.error}`,
	)
	report.check(
		`... after at most responseBytes (${BRIDGE_LIMITS.responseBytes}) + one chunk`,
		read.bytes <= BRIDGE_LIMITS.responseBytes + BRIDGE_LIMITS.chunkBytes,
		`${read.bytes} bytes`,
	)
	const cancel = await waitFor(hub, frame => frame?.t === 'cancel', {
		what: 'cancel',
		timeoutMs: CANCEL_WAIT_MS,
	}).catch(() => null)
	report.check(
		'... and the hub is told to stop (`cancel`), and stops sending',
		cancel?.frame.id === hub.requests[0].id &&
			sent.cancelled &&
			sent.bytes < OVERSIZE_BYTES,
		`cancel ${JSON.stringify(cancel?.frame)}, hub sent ${sent.bytes} bytes in ${Date.now() - startedAt} ms`,
	)
	report.check('... the hub socket stays open', hub.isOpen)
}

// A hub that never answers: 504 HUB_TIMEOUT at the deadline, `cancel` to the hub, the slot freed.
async function silent(ctx, account) {
	const { report } = ctx
	const hub = await openHub(ctx, account, 1)
	const startedAt = Date.now()
	const response = await relayGet(account, hub)
	const waited = Date.now() - startedAt
	const body = await failureOf(response)
	report.check(
		`a hub that never answers: ${RELAY_FAILURE_STATUS.HUB_TIMEOUT} HUB_TIMEOUT`,
		response.status === RELAY_FAILURE_STATUS.HUB_TIMEOUT &&
			body?.code === 'HUB_TIMEOUT',
		`${response.status} ${JSON.stringify(body)}`,
	)
	report.check(
		`... after ${BRIDGE_LIMITS.deadlineMs} ms (+/- ${DEADLINE_SLACK_MS})`,
		Math.abs(waited - BRIDGE_LIMITS.deadlineMs) <= DEADLINE_SLACK_MS,
		`${waited} ms`,
	)
	const [asked] = hub.requests
	const cancel = await waitFor(hub, frame => frame?.t === 'cancel', {
		what: 'cancel',
		timeoutMs: CANCEL_WAIT_MS,
	}).catch(() => null)
	report.check(
		'... and the hub received a `cancel` naming the same relay',
		cancel?.frame.id === asked?.id,
		JSON.stringify(cancel?.frame),
	)
	hub.handler = req => hub.answerJson(req.id, { ok: true })
	const next = await relayGet(account, hub, '0002')
	report.check(
		'... and the object holds nothing of it: the next relay to that hub is answered',
		next.status === 200,
		`${next.status}`,
	)
}

// 32 relays held open by a hub that answers late: the 33rd is a 429, and the 32 still finish.
async function tooMany(ctx, account) {
	const { report } = ctx
	const hub = await openHub(ctx, account, 2)
	hub.handler = () => undefined
	const held = []
	for (let at = 0; at < BRIDGE_LIMITS.inFlightPerUser; at += 1)
		held.push(relayGet(account, hub, `${at}`.padStart(4, '0')))
	await hub.untilRequests(BRIDGE_LIMITS.inFlightPerUser, 15_000)
	const startedAt = Date.now()
	const extra = await relayGet(account, hub, 'ffff')
	const body = await failureOf(extra)
	report.check(
		`the ${BRIDGE_LIMITS.inFlightPerUser + ONE_MORE}rd concurrent relay is ${RELAY_FAILURE_STATUS.TOO_MANY} TOO_MANY`,
		extra.status === RELAY_FAILURE_STATUS.TOO_MANY &&
			body?.code === 'TOO_MANY',
		`${extra.status} ${JSON.stringify(body)} in ${Date.now() - startedAt} ms`,
	)
	for (const asked of hub.requests) hub.answerJson(asked.id, { ok: true })
	const answers = await Promise.all(held)
	report.check(
		`... and the ${BRIDGE_LIMITS.inFlightPerUser} before it are answered 200 once the hub answers`,
		answers.every(each => each.status === 200),
		answers.map(each => each.status).join(','),
	)
}

// The hub's own refusal of an answer too big for it: `err TOO_LARGE` is a 413 for the tab.
async function hubErr(ctx, account) {
	const hub = await openHub(ctx, account, 3)
	hub.handler = req =>
		hub.sendJson({ t: 'err', id: req.id, code: 'TOO_LARGE' })
	const response = await relayGet(account, hub)
	const body = await failureOf(response)
	ctx.report.check(
		`a hub's \`err TOO_LARGE\` is ${RELAY_FAILURE_STATUS.TOO_LARGE} TOO_LARGE for the tab`,
		response.status === RELAY_FAILURE_STATUS.TOO_LARGE &&
			body?.code === 'TOO_LARGE',
		`${response.status} ${JSON.stringify(body)}`,
	)
}

// A hub whose socket ends mid-relay: 502 before its answer started, a cut body after.
async function dropping(ctx, account) {
	const { report } = ctx
	const before = await openHub(ctx, account, 4)
	before.handler = () => {
		before.terminate()
	}
	const early = await relayGet(account, before)
	const body = await failureOf(early)
	report.check(
		'a hub closing before it answered: 502 HUB_OFFLINE',
		early.status === 502 && body?.code === 'HUB_OFFLINE',
		`${early.status} ${JSON.stringify(body)}`,
	)
	const during = await openHub(ctx, account, 4)
	during.handler = req => {
		void during.streamAnswer(req.id, { bytes: 8 * MIB, dropAfterChunks: 2 })
	}
	const cut = await relayGet(account, during)
	const read = await readBody(cut)
	report.check(
		`a hub closing mid-answer: the tab got the head, then its body stops short of 8 MiB${cutWord(ctx)}`,
		cut.status === 200 && isCut(ctx, read, 8 * MIB),
		`${cut.status}, ${read.bytes} bytes, ${read.error}`,
	)
}

// No hub socket: refused at once, nothing waits.
async function offline(ctx, account) {
	const { report, options } = ctx
	const hub = await ctx.hub(account, 5)
	const limit = Number(options['offline-ms'] ?? (ctx.staging ? 250 : 50))
	for (let at = 0; at < WARM_UP; at += 1)
		await relayGet(account, hub).then(each => each.text())
	const times = []
	const statuses = new Set()
	for (let at = 0; at < SAMPLES; at += 1) {
		const startedAt = performance.now()
		const response = await relayGet(account, hub, `${at}`.padStart(4, '0'))
		times.push(performance.now() - startedAt)
		statuses.add(`${response.status} ${(await failureOf(response))?.code}`)
		await delay(5)
	}
	report.check(
		'no hub socket: every relay answers 503 HUB_OFFLINE',
		statuses.size === 1 && statuses.has('503 HUB_OFFLINE'),
		[...statuses].join('; '),
	)
	report.check(
		`... with a median under ${limit} ms (of ${SAMPLES}; worst ${Math.max(...times).toFixed(0)} ms)`,
		median(times) < limit,
		`${median(times).toFixed(1)} ms`,
	)
}

export const t4 = { id: 'T4', title: 'relay bounds', where: 'local', run }
