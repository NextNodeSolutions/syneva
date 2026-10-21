// The hub as the page knows it, fed by the hub's stream (RFC 0001, 4.6) and nothing else: the
// hub's identity, its desks, their pulses, the journal and the plan library. One store and one
// socket per page, opened by its first reader and closed with its last; the hooks read it through
// useSyncExternalStore, the desk tab through subscribeHub. A dropped socket keeps everything as it
// was (the page shows it stale) until the next snapshot replaces it whole.
import { DecodeError } from '@shared/api/decode'
import { openHubStream } from '@shared/api/stream'
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'

import { fetchHubHealth } from './api'
import { decodeHubDesk, decodeHubIdentity } from './decode'
import { decodeJournalEvents } from './journal-decode'
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
import type { JournalEvent } from './journal'
import type { HubDesk, HubIdentity } from './model'
import type { Plan } from './plan-model'
import type { Snapshot, StreamView } from './stream-view'

// A payload that does not read names the stream's path, as an HTTP read names its route.
const SOCKET = BRIDGE_PATHS.tabSocket

const readers = new Set<() => void>()
let view: StreamView = FIRST_VIEW
let stream: HubStream | null = null
// The snapshot being read, from its hello to its snapshot-end; null between two.
let snapshot: Snapshot | null = null
// Desks the hub answered this page's close for, until their `closed` frame: a `desk` frame shaped
// before the close and still on its way does not bring them back.
const forgotten = new Set<string>()

function commit(next: StreamView): void {
	if (next === view) return
	view = next
	for (const reader of readers) reader()
}

// Once per hub start: what the hello does not say (whether the hub asks for its key). One that
// does not answer is read again on the next hello.
async function readHealth(instanceId: string): Promise<void> {
	if (view.health?.instanceId === instanceId) return
	try {
		const health = await fetchHubHealth()
		commit({ ...view, health })
	} catch {
		/* the next hello reads it again */
	}
}

function hello(identity: HubIdentity): void {
	snapshot = emptySnapshot(identity.id)
	commit(greeted(view, identity))
	void readHealth(identity.instanceId)
}

function snapshotEnd(): void {
	if (!snapshot) return
	const whole = snapshot
	snapshot = null
	forgotten.clear()
	commit(settled(view, whole))
}

function desk(summary: HubDesk): void {
	if (snapshot) {
		snapshot.desks.set(summary.id, summary)
		return
	}
	if (!forgotten.has(summary.id)) commit(withDesk(view, summary))
}

function closed(deskId: string): void {
	forgotten.delete(deskId)
	if (!snapshot) {
		commit(withoutDesk(view, deskId))
		return
	}
	snapshot.desks.delete(deskId)
	snapshot.pulses.delete(deskId)
}

function pulse(deskId: string, payload: unknown): void {
	if (snapshot) snapshot.pulses.set(deskId, payload)
	else commit(withPulse(view, deskId, payload))
}

function journal(hubId: string, events: JournalEvent[]): void {
	if (snapshot) snapshot.tail.push(...events)
	else commit(withEvents(view, hubId, events))
}

function plan(record: Plan): void {
	if (snapshot) snapshot.plans.set(record.id, record)
	else commit(withPlan(view, record))
}

function apply(frame: StreamFrame): void {
	switch (frame.t) {
		case 'hello':
			hello(decodeHubIdentity(frame.hub, SOCKET))
			return
		case 'snapshot-end':
			snapshotEnd()
			return
		case 'desk':
			desk(decodeHubDesk(frame.desk, SOCKET))
			return
		case 'closed':
			closed(frame.deskId)
			return
		case 'pulse':
			pulse(frame.deskId, frame.pulse)
			return
		case 'journal':
			journal(frame.hubId, decodeJournalEvents(frame.events, SOCKET))
			return
		case 'plan':
			plan(decodePlan(frame.plan, SOCKET))
			return
		case 'hub':
			commit(withHub(view, frame))
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
		snapshot = null
	}
}

export function hubView(): StreamView {
	return view
}

// The hub answered this page's close: the desk leaves the listing now, before its `closed` frame.
export function forgetDesk(deskId: string): void {
	forgotten.add(deskId)
	commit(withoutDesk(view, deskId))
}

// Calls `listener` each time the hub says hello to this page again (a reconnect, a restarted
// hub): a read the hub left unanswered tries again then, never on a timer. Returns the teardown.
export function onHubHello(listener: () => void): () => void {
	let heard = view.epoch
	return subscribeHub(() => {
		if (view.epoch === heard) return
		heard = view.epoch
		listener()
	})
}

// A plan as a status change answered it: adopted now, the frame that carries it follows.
export function adoptPlan(record: Plan): void {
	commit(withPlan(view, record))
}
