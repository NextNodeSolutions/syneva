// The frames a hub's stream sends (contracts/bridge.ts), shaped from the hub as it stands when
// they are sent. Pure: the local stream, the probe and the web's tab sockets shape them alike.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

import { utf8ByteLength } from '../domain/utf8.js'

import { deskPulse, partialPulse } from './desk-pulse.js'
import { liveDesksByPlan, planOnHub } from './hub-plans.js'

import type { BridgeFrame, HubIdentity } from '@syneva/contracts/bridge'
import type { HubEvent } from '@syneva/contracts/hub'
import type { HubJournal } from '../application/journal.js'
import type { PlanLibrary } from '../application/plan-library.js'
import type { PlanRecord } from '../domain/plan.js'
import type { HubDesk } from './hosted-desk.js'
import type { Hub } from './hub.js'

// What a stream reads: the hub it speaks for (as `identity`), its journal and its plan library.
export type StreamSource = {
	identity: HubIdentity
	hub: Pick<Hub, 'listDesks' | 'restored' | 'subscribe' | 'summary'>
	journal: Pick<HubJournal, 'read'>
	plans: Pick<PlanLibrary, 'list'>
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

export function closedText(hubId: string, deskId: string): string {
	return frameText({ t: 'closed', hubId, deskId })
}

export function deskText(source: StreamSource, desk: HubDesk): string {
	const hubId = source.identity.id
	return frameText({ t: 'desk', hubId, desk: source.hub.summary(desk) })
}

// A desk's pulse, whole when its frame fits `frameBytes`, else partial (desk-pulse.ts): every frame
// a stream shapes stays under the bound, so a desk whose conversation outgrew a frame still has
// its pulse travel, and no reader's socket closes over it (the web's object closes a hub socket
// that sends a frame past the bound, and each reconnect's snapshot would meet the frame again).
export function pulseText(source: StreamSource, desk: HubDesk): string {
	const envelope = {
		t: 'pulse',
		hubId: source.identity.id,
		deskId: desk.id,
	} as const
	const pulse = deskPulse(desk.ctx)
	const whole = frameText({ ...envelope, pulse })
	if (utf8ByteLength(whole) <= BRIDGE_LIMITS.frameBytes) return whole
	return frameText({ ...envelope, pulse: partialPulse(pulse) })
}

// Each plan with the live desk reviewing it as the hub stands now (one read of the desks).
export function planTexts(
	source: StreamSource,
	records: Iterable<PlanRecord>,
): string[] {
	const hubId = source.identity.id
	const desks = liveDesksByPlan(source.hub)
	return [...records].map(record =>
		frameText({ t: 'plan', hubId, plan: planOnHub(record, desks) }),
	)
}

// Journal events, oldest first, as frames of at most `journalPerFrame` events, each under
// `frameBytes`: a batch closes before the event that would carry it past either bound. Measured,
// not guessed: a frame's size is its envelope plus each event's text plus the commas between.
export function journalTexts(
	hubId: string,
	events: readonly HubEvent[],
): string[] {
	const envelope = utf8ByteLength(
		frameText({ t: 'journal', hubId, events: [] }),
	)
	const batches: HubEvent[][] = []
	let batch: HubEvent[] = []
	let bytes = envelope
	for (const event of events) {
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
