// The frames a hub's stream sends (contracts/bridge.ts), shaped from the hub as it stands when
// they are sent. Pure: the local stream, the probe and the web's tab sockets shape them alike.
// A stream names its hub by `identity.id` and every desk accordingly (RFC 4.8): the local stream
// by the desk's local id, a paired hub's probe by its web id, the hub's web id followed by it.
import {
	BRIDGE_LIMITS,
	LOCAL_HUB_ID,
	webDeskId,
} from '@syneva/contracts/bridge'
import { deskPagePath } from '@syneva/contracts/routes'

import { utf8ByteLength } from '../domain/utf8.js'

import { deskPulse, partialPulse } from './desk-pulse.js'
import { liveDesksByPlan, planOnHub } from './hub-plans.js'

import type { BridgeFrame, HubIdentity } from '@syneva/contracts/bridge'
import type { DeskSummary, HubEvent } from '@syneva/contracts/hub'
import type { PairingState } from '@syneva/contracts/pairing'
import type { PlanDesk, PlanSummary } from '@syneva/contracts/plans'
import type { HubJournal } from '../application/journal.js'
import type { PlanLibrary } from '../application/plan-library.js'
import type { PlanRecord } from '../domain/plan.js'
import type { HubDesk } from './hosted-desk.js'
import type { Hub } from './hub.js'

// What a stream reads: the hub it speaks for (as `identity`), its journal and its plan library;
// on the local stream, the hub's pairing with the web too (its tabs alone are told of it).
export type StreamSource = {
	identity: HubIdentity
	hub: Pick<Hub, 'listDesks' | 'restored' | 'subscribe' | 'summary'>
	journal: Pick<HubJournal, 'read'>
	plans: Pick<PlanLibrary, 'list'>
	pairing?: (() => PairingState) | undefined
}

// The id a stream gives a desk or a plan: its local id on the local stream; on a probe its web id
// (RFC 4.8), the hub's web id followed by the local one, so the web resolves the hub from any id a
// route names (a desk's API and page, a plan's routes).
export function streamId(source: StreamSource, localId: string): string {
	const hubId = source.identity.id
	return hubId === LOCAL_HUB_ID ? localId : webDeskId(hubId, localId)
}

// A desk's listing line, named as the stream names it: its id, its page's path, its plan.
export function streamSummary(
	source: StreamSource,
	summary: DeskSummary,
): DeskSummary {
	const id = streamId(source, summary.id)
	if (id === summary.id) return summary
	const plan = summary.plan && streamId(source, summary.plan)
	return { ...summary, id, path: deskPagePath(id), plan }
}

// A plan's record as the stream names it: its id and its live desk's.
export function streamPlan(
	source: StreamSource,
	plan: PlanSummary,
): PlanSummary {
	const id = streamId(source, plan.id)
	if (id === plan.id) return plan
	const desk = plan.desk && streamDesk(source, plan.desk.id)
	return { ...plan, id, desk }
}

function streamDesk(source: StreamSource, deskId: string): PlanDesk {
	const id = streamId(source, deskId)
	return { id, path: deskPagePath(id) }
}

// A frame as it travels: one JSON text.
export function frameText(frame: BridgeFrame): string {
	return JSON.stringify(frame)
}

export function helloText(identity: HubIdentity): string {
	return frameText({ t: 'hello', hub: identity })
}

export function snapshotEndText(hubId: string): string {
	return frameText({ t: 'snapshot-end', hubId })
}

export function closedText(source: StreamSource, deskId: string): string {
	return frameText({
		t: 'closed',
		hubId: source.identity.id,
		deskId: streamId(source, deskId),
	})
}

export function deskText(source: StreamSource, desk: HubDesk): string {
	const hubId = source.identity.id
	const summary = streamSummary(source, source.hub.summary(desk))
	return frameText({ t: 'desk', hubId, desk: summary })
}

// A desk's pulse, whole when its frame fits `frameBytes`, else partial (desk-pulse.ts): every frame
// a stream shapes stays under the bound, so a desk whose conversation outgrew a frame still has
// its pulse travel, and no reader's socket closes over it (the web's object closes a hub socket
// that sends a frame past the bound, and each reconnect's snapshot would meet the frame again).
export function pulseText(source: StreamSource, desk: HubDesk): string {
	const envelope = {
		t: 'pulse',
		hubId: source.identity.id,
		deskId: streamId(source, desk.id),
	} as const
	const pulse = deskPulse(desk.ctx)
	const whole = frameText({ ...envelope, pulse })
	if (utf8ByteLength(whole) <= BRIDGE_LIMITS.frameBytes) return whole
	return frameText({ ...envelope, pulse: partialPulse(pulse) })
}

// The hub's pairing as it stands now; null on a stream that does not carry it (the probe's).
export function pairingText(source: StreamSource): string | null {
	if (!source.pairing) return null
	const hubId = source.identity.id
	return frameText({ t: 'pairing', hubId, pairing: source.pairing() })
}

// Each plan with the live desk reviewing it as the hub stands now (one read of the desks).
export function planTexts(
	source: StreamSource,
	records: Iterable<PlanRecord>,
): string[] {
	const hubId = source.identity.id
	const desks = liveDesksByPlan(source.hub)
	return [...records].map(record =>
		frameText({
			t: 'plan',
			hubId,
			plan: streamPlan(source, planOnHub(record, desks)),
		}),
	)
}

// Journal events, oldest first, as frames of at most `journalPerFrame` events, each under
// `frameBytes`: a batch closes before the event that would carry it past either bound. Measured,
// not guessed: a frame's size is its envelope plus each event's text plus the commas between.
export function journalTexts(
	source: StreamSource,
	events: readonly HubEvent[],
): string[] {
	const hubId = source.identity.id
	const envelope = utf8ByteLength(
		frameText({ t: 'journal', hubId, events: [] }),
	)
	const batches: HubEvent[][] = []
	let batch: HubEvent[] = []
	let bytes = envelope
	for (const event of events.map(each => streamEvent(source, each))) {
		const size = utf8ByteLength(JSON.stringify(event))
		if (batch.length && isFull(batch.length, bytes + size + 1)) {
			batches.push(batch)
			batch = []
			bytes = envelope
		}
		bytes += size + (batch.length ? 1 : 0)
		batch.push(event)
	}
	if (batch.length) batches.push(batch)
	return batches.map(each => frameText({ t: 'journal', hubId, events: each }))
}

function isFull(count: number, bytesWithNext: number): boolean {
	return (
		count >= BRIDGE_LIMITS.journalPerFrame ||
		bytesWithNext > BRIDGE_LIMITS.frameBytes
	)
}

function streamEvent(source: StreamSource, event: HubEvent): HubEvent {
	const deskId = streamId(source, event.deskId)
	return deskId === event.deskId ? event : { ...event, deskId }
}
