// T5 memory (RFC 0001, 6.7; guard R5): concurrent answers streamed through the object, each hub
// socket within its budget, are never held whole in it. Scaled: 8 relays of 8 MiB, one per hub
// (a hub socket carries 2 MiB/s, so eight hubs move 64 MiB in about six seconds), each compared
// byte for byte by sha256. `--full` is the RFC's 32 relays of 32 MiB, for a deployed Worker.
import { BRIDGE_LIMITS } from '../../../packages/contracts/dist/bridge.js'

import { readBody, relayGet } from './relay-client.mjs'
import { isOpen, openHub } from './sockets.mjs'

const MIB = 1_048_576
const SCALED = { relays: 8, mib: 8 }
const FULL = { relays: BRIDGE_LIMITS.inFlightPerUser, mib: 32 }
const MS_PER_S = 1000

async function run(ctx) {
	const { report, options } = ctx
	const shape = options.full ? FULL : SCALED
	const bytes = shape.mib * MIB
	const account = await ctx.account(0)
	const hubs = []
	for (let at = 0; at < BRIDGE_LIMITS.hubsPerUser; at += 1) {
		const hub = await openHub(ctx, account, at)
		hub.sent = new Map()
		hub.handler = req => {
			hub.sent.set(req.path, hub.streamAnswer(req.id, { bytes }))
		}
		hubs.push(hub)
	}
	const tab = await ctx.tab(account)
	const startedAt = Date.now()
	const results = await Promise.all(
		Array.from({ length: shape.relays }, (_, at) =>
			oneRelay(account, hubs, at),
		),
	)
	const seconds = (Date.now() - startedAt) / MS_PER_S
	const sent = new Map()
	for (const hub of hubs)
		for (const [path, streamed] of hub.sent) sent.set(path, await streamed)
	const done = results.filter(
		each =>
			each.status === 200 &&
			each.read.bytes === bytes &&
			!each.read.error,
	)
	const exact = done.filter(
		each => each.read.sha256 === sent.get(each.path)?.sha256,
	)
	report.check(
		`${shape.relays} concurrent relays of ${shape.mib} MiB streamed (${((shape.relays * bytes) / MIB / seconds).toFixed(1)} MiB/s in ${seconds.toFixed(1)} s)`,
		results.length === shape.relays,
		`${results.length} relays`,
	)
	if (options.full) fullOutcome(ctx, { results, done, exact, hubs, tab })
	else
		report.check(
			`every one completed, byte-exact (${exact.length} of ${shape.relays} sha256 equal)`,
			exact.length === shape.relays,
			results
				.map(
					each =>
						`${each.status}/${each.read.bytes}/${each.read.error}`,
				)
				.join(' '),
		)
	report.check(
		'every hub socket and the tab are still open after',
		isOpen(tab, ...hubs),
		`${[tab, ...hubs].filter(peer => peer.isOpen).length} of ${hubs.length + 1} open`,
	)
	if (!options.full)
		report.check(
			'no relay was cancelled by the object',
			hubs.every(hub => !hub.cancels.length),
			hubs.map(hub => hub.cancels.length).join(','),
		)
	await afterwards(ctx, account, hubs)
	ctx.printReads('T5', { from: null, to: null })
}

async function oneRelay(account, hubs, at) {
	const hub = hubs[at % hubs.length]
	const tag = `${at}`.padStart(4, '0')
	const startedAt = Date.now()
	const response = await relayGet(account, hub, tag)
	const read = await readBody(response)
	return {
		path: `/api/desks/${hub.hubId}${tag}/state`,
		status: response.status,
		read,
		ms: Date.now() - startedAt,
	}
}

// 32 x 32 MiB cannot finish: eight hub sockets carry 16 MiB/s of frames, the Worker's deadline is
// 30 s. What must hold is that each relay ends - whole and exact, or cut - and the object lives.
function fullOutcome(ctx, { results, done, exact, hubs, tab }) {
	const { report } = ctx
	const cut = results.length - done.length
	ctx.note(
		`${done.length} relays completed, ${cut} cut by the deadline or the bound`,
	)
	report.check(
		'every relay that completed is byte-exact',
		exact.length === done.length,
		`${exact.length} of ${done.length}`,
	)
	report.check(
		'the object is alive: every socket still open',
		isOpen(tab, ...hubs),
		'',
	)
}

// The object still serves a relay, and its caps are free again.
async function afterwards(ctx, account, hubs) {
	const [hub] = hubs
	hub.handler = req => hub.answerJson(req.id, { ok: true })
	const answer = await relayGet(account, hub, 'beef')
	ctx.report.check(
		'a relay after the storm is answered 200 (nothing left held)',
		answer.status === 200,
		`${answer.status}`,
	)
}

export const t5 = { id: 'T5', title: 'memory', where: 'local', run }
