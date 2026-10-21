// The hub as the page knows it, fed by the hub's stream (RFC 0001, 4.6) and nothing else: the
// hub's identity, its desks, their pulses, the journal, the plan library and its pairing. One
// store and one socket per page, opened by its first reader and closed with its last; the hooks
// read it through useSyncExternalStore, the desk tab through subscribeHub. A dropped socket keeps
// everything as it was (the page shows it stale) until the next snapshot replaces it whole.
import { DecodeError } from '@shared/api/decode'
import { openHubStream } from '@shared/api/stream'
import { createAnswerRetry } from '@shared/lib/answer-retry'
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'

import { fetchHubHealth } from './api'
import { decodeHubDesk, decodeHubIdentity, decodeHubPresence } from './decode'
import { hubOfId } from './hub-ids'
import { decodeJournalEvents } from './journal-decode'
import { decodePairing } from './pairing'
import { decodePlan } from './plan-decode'
import {
	emptySnapshot,
	FIRST_VIEW,
	greeted,
	settled,
	withDesk,
	withEvents,
	withHub,
	withoutDesk,
	withPlan,
	withPulse,
} from './stream-view'

import type { HubStream } from '@shared/api/stream'
import type { StreamFrame } from '@shared/api/stream-frame'
import type { AnswerRetry } from '@shared/lib/answer-retry'
import type { JournalEvent } from './journal'
import type { HubDesk, HubIdentity } from './model'
import type { Plan } from './plan-model'
import type { Snapshot, StreamView } from './stream-view'

// A payload that does not read names the stream's path, as an HTTP read names its route.
const SOCKET = BRIDGE_PATHS.tabSocket

const readers = new Set<() => void>()
let view: StreamView = FIRST_VIEW
let stream: HubStream | null = null
// The snapshots being read, each from its hub's hello to its snapshot-end: one hub on a local
// page, several on the web, where they interleave.
const snapshots = new Map<string, Snapshot>()
// Desks the hub answered this page's close for whose `closed` frame has not come yet, each with
// the life it closed (its `openedAt`): a `desk` frame of that life, shaped before the close and
// still on its way, does not bring it back. A desk's id is its repo and session, so the same
// session opened again comes back on the same id: a `desk` frame of a newer life is that new desk,
// shown at once, and ends the hold. The `closed` frame ends it too; a close whose `closed` frame
// came before its answer holds nothing.
const forgotten = new Map<string, string>()
// Called with every frame the stream brings, once the store took it in: the hub answering, which
// a read it left unanswered waits for (retryWhenHubAnswers).
const frameReaders = new Set<(frame: StreamFrame) => void>()

function commit(next: StreamView): void {
	if (next === view) return
	view = next
	for (const reader of readers) reader()
}

// Once per hub start: what the hello does not say (whether the hub asks for its key). One the
// hub left unanswered is read again when it next answers; a new hello reads its own hub's.
const healthRetry = createAnswerRetry(() => void readHealth())

async function readHealth(): Promise<void> {
	// On the web every hub says hello with an instance of its own while the health is the web's:
	// it is read once.
	if (view.health && view.mode === 'web') return
	const instanceId = view.identity?.instanceId
	if (!instanceId || view.health?.instanceId === instanceId) return
	try {
		const health = await fetchHubHealth()
		commit({ ...view, health })
		healthRetry.settled()
	} catch {
		healthRetry.failed()
	}
}

function hello(identity: HubIdentity): void {
	snapshots.set(identity.id, emptySnapshot(identity.id))
	commit(greeted(view, identity))
	healthRetry.settled()
	void readHealth()
}

function snapshotEnd(hubId: string): void {
	const whole = snapshots.get(hubId)
	if (!whole) return
	snapshots.delete(hubId)
	for (const deskId of forgotten.keys())
		if (hubOfId(deskId) === hubId) forgotten.delete(deskId)
	commit(settled(view, whole))
}

function desk(hubId: string, summary: HubDesk): void {
	const reading = snapshots.get(hubId)
	if (reading) {
		reading.desks.set(summary.id, summary)
		return
	}
	if (forgotten.get(summary.id) === summary.openedAt) return
	forgotten.delete(summary.id)
	commit(withDesk(view, summary))
}

function closed(hubId: string, deskId: string): void {
	forgotten.delete(deskId)
	const reading = snapshots.get(hubId)
	if (!reading) {
		commit(withoutDesk(view, deskId))
		return
	}
	reading.desks.delete(deskId)
	reading.pulses.delete(deskId)
}

function pulse(hubId: string, deskId: string, payload: unknown): void {
	const reading = snapshots.get(hubId)
	if (reading) reading.pulses.set(deskId, payload)
	else commit(withPulse(view, deskId, payload))
}

function journal(hubId: string, events: JournalEvent[]): void {
	const reading = snapshots.get(hubId)
	if (reading) reading.tail.push(...events)
	else commit(withEvents(view, hubId, events))
}

function plan(hubId: string, record: Plan): void {
	const reading = snapshots.get(hubId)
	if (reading) reading.plans.set(record.id, record)
	else commit(withPlan(view, record))
}

function apply(frame: StreamFrame): void {
	switch (frame.t) {
		case 'hello':
			hello(decodeHubIdentity(frame.hub, SOCKET))
			return
		case 'snapshot-end':
			snapshotEnd(frame.hubId)
			return
		case 'desk':
			desk(frame.hubId, decodeHubDesk(frame.desk, SOCKET, frame.hubId))
			return
		case 'closed':
			closed(frame.hubId, frame.deskId)
			return
		case 'pulse':
			pulse(frame.hubId, frame.deskId, frame.pulse)
			return
		case 'journal':
			journal(
				frame.hubId,
				decodeJournalEvents(frame.events, SOCKET, frame.hubId),
			)
			return
		case 'plan':
			plan(frame.hubId, decodePlan(frame.plan, SOCKET, frame.hubId))
			return
		case 'pairing':
			// Whole each time, and apart from the desks: taken at once, even mid-snapshot.
			commit({ ...view, pairing: decodePairing(frame.pairing, SOCKET) })
			return
		case 'hub':
			commit(withHub(view, decodeHubPresence(frame), Date.now()))
	}
}

// A payload that does not read is dropped, as the transport drops a frame that does not: the
// stream goes on (the conformance check guards what the hub sends).
function received(frame: StreamFrame): void {
	try {
		apply(frame)
	} catch (error) {
		if (!(error instanceof DecodeError)) throw error
	}
	healthRetry.heard(frame.t === 'hello')
	for (const reader of frameReaders) reader(frame)
}

export function subscribeHub(reader: () => void): () => void {
	readers.add(reader)
	stream ??= openHubStream({
		onFrame: received,
		onState: state => {
			commit({ ...view, stream: state })
		},
	})
	return () => {
		readers.delete(reader)
		if (readers.size) return
		stream?.stop()
		stream = null
		snapshots.clear()
	}
}

export function hubView(): StreamView {
	return view
}

// The hub answered this page's close: the desk leaves the listing now, before its `closed` frame,
// unless the stream already said more about its id - that frame came first (the desk is no longer
// listed), or the session was opened again since (the id lists a newer life), which stays.
export function forgetDesk(closedDesk: HubDesk): void {
	const listed = view.listing.desks?.find(each => each.id === closedDesk.id)
	if (listed?.openedAt !== closedDesk.openedAt) return
	forgotten.set(closedDesk.id, closedDesk.openedAt)
	commit(withoutDesk(view, closedDesk.id))
}

// A read of the hub's that failed runs `again` when the hub next answers, never on a timer: on
// its next hello (a reconnect, a restarted hub), or on the first frame its stream brings past the
// read's wait, which doubles while it keeps failing (AnswerRetry). Any frame is the hub answering,
// so a read that failed while the socket stayed up (a dropped request, a 5xx) does not wait for a
// reconnect that may never come. The caller says how each run went (`failed`, `settled`); the
// retry holds the stream open until `stop`.
export type HubRetry = Pick<AnswerRetry, 'failed' | 'settled'> & {
	stop: () => void
}

export function retryWhenHubAnswers(again: () => void): HubRetry {
	const retry = createAnswerRetry(again)
	const reader = (frame: StreamFrame): void => {
		retry.heard(frame.t === 'hello')
	}
	frameReaders.add(reader)
	const release = subscribeHub(() => undefined)
	return {
		failed: retry.failed,
		settled: retry.settled,
		stop: () => {
			frameReaders.delete(reader)
			release()
		},
	}
}

// A plan as a status change answered it: adopted now, the frame that carries it follows.
export function adoptPlan(record: Plan): void {
	commit(withPlan(view, record))
}
