// What a tab on the web reads: the probe's frames through the fake's tab socket, every desk and
// plan named by its web id (the hub's web id followed by the local id, RFC 4.8). The local
// routes' answers mapped the same way are what those frames must equal.
import {
	BRIDGE_PATHS,
	webDeskId,
} from '../../packages/contracts/dist/bridge.js'
import { deskPagePath } from '../../packages/contracts/dist/routes.js'
import { openReader, socketUrl, waitFor } from '../stream/stream-client.mjs'

export const SESSION = 'bridge-check'
export const PLAN_SESSION = 'bridge-check-plan'
const SNAPSHOT_ORDER = /^(desk pulse )*(journal )*(plan )*snapshot-end$/

export async function openTab(fake) {
	const tab = openReader(socketUrl(fake.origin, BRIDGE_PATHS.tabSocket))
	await tab.outcome
	return tab
}

// The next snapshot on the tab from `from`: its hello, its frames, where it ends.
export async function nextSnapshot(tab, from = 0) {
	const hello = await waitFor(tab, frame => frame?.t === 'hello', {
		from,
		what: 'hello',
	})
	const start = tab.frames.indexOf(hello)
	const end = await waitFor(tab, frame => frame?.t === 'snapshot-end', {
		from: start,
		what: 'snapshot-end',
	})
	const frames = tab.frames
		.slice(start + 1, tab.frames.indexOf(end) + 1)
		.map(each => each.frame)
		.filter(frame => frame.t !== 'hub')
	return { hello: hello.frame, frames, end: tab.frames.indexOf(end) }
}

export function isSnapshotOrder(frames) {
	return SNAPSHOT_ORDER.test(frames.map(frame => frame.t).join(' '))
}

// A local desk summary (as JSON read it) named as the probe's stream names it.
export function webSummary(hubId, summary) {
	const id = webDeskId(hubId, summary.id)
	const named = { ...summary, id, path: deskPagePath(id) }
	if (summary.plan) named.plan = webDeskId(hubId, summary.plan)
	return named
}

export function webPlan(hubId, plan) {
	const desk = plan.desk && webDesk(hubId, plan.desk.id)
	return { ...plan, id: webDeskId(hubId, plan.id), desk }
}

function webDesk(hubId, deskId) {
	const id = webDeskId(hubId, deskId)
	return { id, path: deskPagePath(id) }
}

export const isJournal = (kind, id) => frame =>
	frame?.t === 'journal' &&
	frame.events.some(event => event.kind === kind && event.deskId === id)

export const isPulse =
	(id, test = () => true) =>
	frame =>
		frame?.t === 'pulse' && frame.deskId === id && test(frame.pulse)

export const isDesk = id => frame => frame?.t === 'desk' && frame.desk.id === id
