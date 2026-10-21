// The live desks among the hub's map: a closed desk is already gone to every caller (its routes answer 404, the listing and the registry leave it out) while its entry lingers for the grace.
import { reopenedRecord } from './hub-records.js'

import type { DeskQuery } from '../application/open-desk.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { HubDesk } from './hosted-desk.js'

// How long a closed desk's entry outlives its `closed` event. A deadline, not a timer: the
// entry is pruned on the hub's next read or write of its map once the grace is past, since core
// also runs in the user's Durable Object, which a pending timer keeps awake and billed (RFC 0001,
// 6.1 W4).
const CLOSED_EVENT_GRACE_MS = 150

// Drops the closed desks whose grace is past, then hands the map back: every listing, lookup and
// registry write goes through here first.
export function pruneClosed(
	desks: Map<string, HubDesk>,
	now: number,
): Map<string, HubDesk> {
	for (const [id, desk] of desks) if (isPastGrace(desk, now)) desks.delete(id)
	return desks
}

function isPastGrace(desk: HubDesk, now: number): boolean {
	return (
		desk.closedAt !== null && now - desk.closedAt >= CLOSED_EVENT_GRACE_MS
	)
}

function isLive(desk: HubDesk): boolean {
	return desk.closedAt === null
}

export function liveDesk(
	desks: Map<string, HubDesk>,
	id: string,
): HubDesk | undefined {
	const desk = desks.get(id)
	if (!desk || !isLive(desk)) return undefined
	return desk
}

export function liveDesks(desks: Map<string, HubDesk>): HubDesk[] {
	return [...desks.values()].filter(isLive)
}

export function liveRecords(desks: Map<string, HubDesk>): HubDeskRecord[] {
	return liveDesks(desks).map(desk => desk.record)
}

// The record is what a restart rebuilds from: a reopen that changed the guide expectation, or
// made the desk a plan desk, must outlive the hub too. Applied in memory here (true when it
// changed, so the caller writes the registry), before the reload's event: that event reaches
// the plan library when this open makes the desk a plan desk.
export function keepOpenPreferences(
	desks: Map<string, HubDesk>,
	id: string,
	query: DeskQuery,
): boolean {
	const desk = desks.get(id)
	if (!desk) return false
	const record = reopenedRecord(desk.record, query)
	if (record === desk.record) return false
	desk.record = record
	return true
}
