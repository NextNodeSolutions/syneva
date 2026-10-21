// What the probe refuses before its router sees it, and its bounds (RFC 0001, 4.5 and 4.7): a
// path the web never relays answers 404 NOT_RELAYED at once (the hub's shutdown not run, the
// agent's parked await not parked), a desk of another hub likewise, a `req` that does not read
// 400; a cancel stops the answer's frames and leaves the hub healthy; past inFlightPerUser
// relays at once, the next is `err TOO_MANY`. Sent raw through the fake, as the web never would.
import { setTimeout as delay } from 'node:timers/promises'

import { BRIDGE_LIMITS } from '../../packages/contracts/dist/bridge.js'
import { deskApiBase, HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_OK } from './http-wire.mjs'
import { webOf, writeRandom } from './relay-checks.mjs'

const MIB = 1_048_576
const CANCEL_MIB = 24
// How long a refusal may take: answered at once, never dispatched to a parked route.
const REFUSAL_MS = 2000
// How long after a cancel no frame of that relay may still arrive.
const AFTER_CANCEL_MS = 1500
const OTHER_HUB = 'ffffffffffffffff'
// The cancel goes once the answer started: its `res` and a first chunk.
const CANCEL_AFTER_FRAMES = 2
const LOOK_MS = 100

export async function checkRefusals(context, desk) {
	await checkNotRelayed(context, desk)
	await checkCancel(context, desk)
	await checkCap(context, desk)
}

async function checkNotRelayed(context, desk) {
	const { report, fake, record, hub } = context
	report.section('relay: refusals and bounds')
	const base = deskApiBase(desk.webId)
	const refusals = refusalsOf(desk)
	const answers = await Promise.all(
		refusals.map(
			([method, route]) =>
				fake.relay.raw(
					record.hubId,
					{ method, path: route, query: '' },
					REFUSAL_MS,
				).done,
		),
	)
	refusals.forEach(([method, route], at) => {
		const [frame] = answers[at]
		report.check(
			`${method} ${route.replace(desk.webId, '<web id>')}: 404 NOT_RELAYED, never dispatched`,
			frame?.t === 'res' &&
				frame.status === HTTP_NOT_FOUND &&
				failureCode(frame) === 'NOT_RELAYED',
			JSON.stringify(frame ?? 'no answer'),
		)
	})
	report.check(
		'the hub still runs (its shutdown was never dispatched)',
		(await hub.health())?.ok === true,
	)
	const malformed = fake.relay.raw(
		record.hubId,
		{ method: 'PUT', path: `${base}/state`, query: '' },
		REFUSAL_MS,
	)
	const [answer] = await malformed.done
	report.check(
		'a req that does not read answers 400',
		answer?.t === 'res' && answer.status === HTTP_BAD_REQUEST,
	)
}

// Never relayed: the routes the web replaces or never reaches (/poll, the agent's parked await,
// the hub's shutdown and stream, the sign-in, the pairing route, the desk list, the pages), a
// desk of another hub, a path that does not read as itself.
function refusalsOf(desk) {
	const base = deskApiBase(desk.webId)
	return [
		['GET', `${base}/poll`],
		['GET', `${base}/await-send`],
		['POST', HUB_PATHS.shutdown],
		['GET', HUB_PATHS.hubSocket],
		['GET', HUB_PATHS.login],
		['POST', HUB_PATHS.bridgeReconnect],
		['GET', HUB_PATHS.desks],
		['GET', '/'],
		['GET', `${deskApiBase(OTHER_HUB + desk.localId)}/state`],
		['GET', `${base}/../${desk.webId}/state`],
	]
}

// The hub's failure code in a `res` body (base64 of its JSON).
function failureCode(frame) {
	if (!frame.body) return ''
	return JSON.parse(Buffer.from(frame.body, 'base64').toString('utf8')).code
}

async function checkCancel({ report, fake, record, repo }, desk) {
	await writeRandom(repo, 'cancel.bin', CANCEL_MIB * MIB)
	const raw = fake.relay.raw(record.hubId, {
		method: 'GET',
		path: `${deskApiBase(desk.webId)}/blob`,
		query: '?path=cancel.bin',
	})
	await waitForFrames(raw, CANCEL_AFTER_FRAMES)
	raw.cancel()
	const cancelledAt = Date.now()
	const held = raw.frames.length
	await delay(AFTER_CANCEL_MS)
	const late = fake.sockets.frames.filter(
		each =>
			each.frame?.id === raw.id &&
			each.at > cancelledAt + BRIDGE_LIMITS.coalesceMs,
	)
	report.check(
		`a cancel stops the answer (${held} of its frames before, none after)`,
		!late.length && raw.frames.at(-1)?.more === true,
		`${late.length} late`,
	)
	const state = await webOf({ fake, record })(
		`${deskApiBase(desk.webId)}/state`,
	)
	report.check(
		'the hub answers the next relay after a cancel',
		state.status === HTTP_OK,
	)
}

// inFlightPerUser answers streaming at once (1 MiB each, paced at bytesPerSecond, so all still in
// flight), then one more: err TOO_MANY. The rest are cancelled.
async function checkCap({ report, fake, record, repo }, desk) {
	await writeRandom(repo, 'one.bin', MIB)
	const request = {
		method: 'GET',
		path: `${deskApiBase(desk.webId)}/blob`,
		query: '?path=one.bin',
	}
	const held = Array.from({ length: BRIDGE_LIMITS.inFlightPerUser }, () =>
		fake.relay.raw(record.hubId, request),
	)
	const extra = fake.relay.raw(record.hubId, request, REFUSAL_MS)
	const [refused] = await extra.done
	report.check(
		`past ${BRIDGE_LIMITS.inFlightPerUser} relays in flight, the next is err TOO_MANY`,
		refused?.t === 'err' && refused.code === 'TOO_MANY',
		JSON.stringify(refused ?? 'no answer'),
	)
	for (const raw of held) raw.cancel()
	await delay(AFTER_CANCEL_MS)
	const state = await webOf({ fake, record })(
		`${deskApiBase(desk.webId)}/state`,
	)
	report.check(
		'the cancelled relays leave the cap: the next relay is answered',
		state.status === HTTP_OK,
	)
}

async function waitForFrames(raw, count) {
	const deadline = Date.now() + BRIDGE_LIMITS.deadlineMs
	const look = async () => {
		if (raw.frames.length >= count || Date.now() > deadline) return
		await delay(LOOK_MS)
		await look()
	}
	await look()
}
