// The probe's stream as a tab on the web reads it (RFC 0001, 4.4 and 4.6): `hello` with the web
// hub id and the hub's identity, the snapshot, then the frames an agent's and a reviewer's actions
// raise (open, open plan, comment, ask, await, send, reload), every one naming the hub and its
// desks and plans by their web ids, while the hub's own stream keeps the local ids.
import { isDeepStrictEqual } from 'node:util'

import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'
import { waitFor } from '../stream/stream-client.mjs'

import { readLocal } from './pairing-checks.mjs'
import { roundActions } from './round-actions.mjs'
import {
	isSnapshotOrder,
	nextSnapshot,
	openTab,
	PLAN_SESSION,
	SESSION,
	webPlan,
	webSummary,
} from './web-ids.mjs'

export async function checkHello({ report, fake, record, hub }) {
	report.section('stream: hello and snapshot')
	const tab = await openTab(fake)
	const snapshot = await report.step('a tab connecting gets a snapshot', () =>
		nextSnapshot(tab),
	)
	if (!snapshot) return tab
	const { hello, frames } = snapshot
	const health = await hub.health()
	report.check(
		'hello names the hub by its web id, with its name and identity',
		hello.hub.id === record.hubId &&
			hello.hub.name === record.name &&
			hello.hub.version === health.version &&
			hello.hub.instanceId === health.instanceId &&
			hello.hub.startedAt === health.startedAt,
		JSON.stringify(hello.hub),
	)
	report.check(
		'desk+pulse pairs, journal, plans, snapshot-end',
		isSnapshotOrder(frames),
	)
	report.check(
		'every snapshot frame names the web hub id',
		frames.every(frame => frame.hubId === record.hubId),
	)
	return tab
}

// The two desks of the check (a repo desk, a plan desk) opened, and a round driven on the first.
export async function checkEvents(context, tab) {
	const { report } = context
	report.section('stream: live frames with web ids')
	const actions = roundActions(context, tab)
	const desk = await actions.open()
	if (!desk) return null
	const plan = await actions.openPlan()
	await actions.round(desk)
	await actions.reload(desk)
	return { desk, plan, actions }
}

// `snapshot?` from the web: `hello` and a whole snapshot, equal to the local routes mapped to web
// ids (the desks newest first, the plans).
export async function checkResnapshot({ report, fake, record, driver }, tab) {
	report.section('stream: snapshot?')
	const from = tab.frames.length
	fake.sockets.send(record.hubId, { t: 'snapshot?' })
	const snapshot = await report.step(
		'snapshot? answers hello and a snapshot',
		() => nextSnapshot(tab, from),
	)
	if (!snapshot) return
	const { body: listed } = await driver.json(HUB_PATHS.desks)
	const desks = snapshot.frames.filter(frame => frame.t === 'desk')
	report.check(
		`its desks are /api/hub/desks with web ids (${desks.length})`,
		desks.length > 0 &&
			isDeepStrictEqual(
				desks.map(frame => frame.desk),
				listed.desks.map(each => webSummary(record.hubId, each)),
			),
	)
	const { body: plans } = await driver.json(HUB_PATHS.plans)
	const sent = snapshot.frames.filter(frame => frame.t === 'plan')
	report.check(
		`its plans are /api/hub/plans with web ids (${sent.length})`,
		sent.length > 0 &&
			isDeepStrictEqual(
				sent.map(frame => frame.plan),
				plans.plans.map(each => webPlan(record.hubId, each)),
			),
	)
}

// The desks closed: `closed` and `desk-closed` by web id. Then a second tab's snapshot shares
// the first's journal events by (hubId, seq), each the same; the local stream kept local ids;
// no `pairing` frame ever went to the web.
export async function checkClose(context, tab, opened) {
	const { report, fake, record, hub } = context
	report.section('stream: close, dedupe, local ids')
	const local = await readLocal(hub)
	const from = local.frames.length
	await opened.actions.close(opened.desk, SESSION)
	await opened.actions.close(opened.plan, PLAN_SESSION)
	await report.step('the local stream names the desk by its local id', () =>
		waitFor(
			local,
			frame =>
				frame?.t === 'closed' && frame.deskId === opened.desk.localId,
			{ from, what: 'closed with the local id' },
		),
	)
	local.socket.close()
	const second = await openTab(fake)
	const replay = await report.step('a second tab gets a snapshot', () =>
		nextSnapshot(second),
	)
	checkDedupe(report, tab, replay?.frames ?? [])
	second.socket.close()
	report.check(
		'no pairing frame ever went to the web',
		!fake.sockets.frames.some(each => each.frame?.t === 'pairing'),
	)
	report.check(
		'every frame from the hub named its web id',
		fake.sockets.frames
			.filter(
				each =>
					typeof each.frame?.hubId === 'string' ||
					each.frame?.t === 'hello',
			)
			.every(
				each =>
					(each.frame.hubId ?? each.frame.hub.id) === record.hubId,
			),
	)
}

function checkDedupe(report, tab, replayed) {
	const held = journalOf(tab.frames.map(each => each.frame))
	const again = journalOf(replayed)
	const shared = [...again.keys()].filter(key => held.has(key))
	report.check(
		`the second tab's tail deduplicates by (hubId, seq) (${shared.length} shared)`,
		shared.length > 0 &&
			shared.every(key =>
				isDeepStrictEqual(held.get(key), again.get(key)),
			),
	)
}

function journalOf(frames) {
	return new Map(
		frames
			.filter(frame => frame?.t === 'journal')
			.flatMap(frame =>
				frame.events.map(event => [
					`${frame.hubId}:${event.seq}`,
					event,
				]),
			),
	)
}
