// What a live stream must agree with once quiet: the HTTP routes (the last desk, pulse and plan
// frames), the journal (every event since the snapshot, once, in order), the hub id on every
// frame and the coalescing window per desk.
import { isDeepStrictEqual } from 'node:util'

import { BRIDGE_LIMITS } from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { settle } from './stream-client.mjs'

// Arrival jitter the coalescing check forgives: the window is the hub's, measured at the reader.
const JITTER_MS = 25
// Quiet for this many windows: the hub has nothing left to send.
const QUIET_WINDOWS = 2
export const QUIET_MS = BRIDGE_LIMITS.coalesceMs * QUIET_WINDOWS

export const isLine = id => frame => frame?.t === 'desk' && frame.desk.id === id
export const isPulse =
	(id, test = () => true) =>
	frame =>
		frame?.t === 'pulse' && frame.deskId === id && test(frame.pulse)
export const isPlan = id => frame => frame?.t === 'plan' && frame.plan.id === id

// Once quiet, the last frames are what the routes answer: the desk's summary (read first: a desk
// route stamps its activity, which moves the summary), its pulse, its plan.
export async function converge({ report, reader, driver }, { id, plan }) {
	await settle(reader, QUIET_MS)
	const latest = predicate =>
		reader.frames.findLast(each => predicate(each.frame))?.frame
	const { body: listed } = await driver.json(`${HUB_PATHS.desks}/${id}`)
	report.check(
		'converged: the last desk frame is /api/hub/desks/<id>',
		isDeepStrictEqual(latest(isLine(id))?.desk, listed.desk),
	)
	const plans = plan ? (await driver.json(HUB_PATHS.plans)).body.plans : []
	const { serverInstanceId, ...polled } = latest(isPulse(id))?.pulse ?? {}
	const [poll, state] = await Promise.all([
		driver.json(`/api/desks/${id}/poll`),
		driver.json(`/api/desks/${id}/state`),
	])
	report.check(
		'converged: the last pulse is /poll and /state instance',
		isDeepStrictEqual(polled, poll.body) &&
			serverInstanceId === state.body.serverInstanceId,
	)
	if (!plan) return
	const record = plans.find(each => each.id === plan.id)
	report.check(
		'converged: the last plan frame is /api/hub/plans, its desk the plan desk',
		isDeepStrictEqual(latest(isPlan(plan.id))?.plan, record) &&
			record?.desk?.id === plan.deskId,
	)
}

// Every journal event since the snapshot came once, in seq order: /api/hub/journal's own list.
export async function checkJournalWhole({ report, reader, driver, snapshot }) {
	const events = reader.frames
		.slice(snapshot.end + 1)
		.filter(each => each.frame.t === 'journal')
		.flatMap(each => each.frame.events)
	const seqs = events.map(event => event.seq)
	report.check(
		'live journal seqs follow the snapshot, strictly increasing',
		seqs.every((seq, at) => seq > (at ? seqs[at - 1] : snapshot.latestSeq)),
		seqs.join(','),
	)
	const route = `${HUB_PATHS.journal}?after=${snapshot.latestSeq}&limit=${BRIDGE_LIMITS.journalTail}`
	const { body } = await driver.json(route)
	report.check(
		`every event since the snapshot came once (${events.length})`,
		isDeepStrictEqual(events, body.events),
	)
}

// Every live frame names the hub; per desk, its `desk` and `pulse` frames are a window apart.
export function checkLiveFrames({ report, reader, snapshot }) {
	const live = reader.frames.slice(snapshot.end + 1)
	const hubId = snapshot.hello.hub.id
	report.check(
		`every live frame names the hub (${live.length})`,
		live.every(each => each.frame.hubId === hubId),
	)
	for (const kind of ['desk', 'pulse']) {
		const gap = closestGap(live, kind)
		report.check(
			`at most one ${kind} frame per desk per coalesceMs (closest: ${gap} ms)`,
			gap >= BRIDGE_LIMITS.coalesceMs - JITTER_MS,
		)
	}
}

function closestGap(live, kind) {
	const last = new Map()
	let closest = Infinity
	for (const { frame, at } of live) {
		if (frame.t !== kind) continue
		const id = kind === 'desk' ? frame.desk.id : frame.deskId
		if (last.has(id)) closest = Math.min(closest, at - last.get(id))
		last.set(id, at)
	}
	return closest
}
