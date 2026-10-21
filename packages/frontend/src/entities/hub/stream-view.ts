import { FIRST_FOLLOW, followed, tailed } from './journal-follow'

import type { StreamState } from '@shared/api/stream'
import type { JournalEvent } from './journal'
import type { JournalFollow } from './journal-follow'
import type { HubDesk, HubHealth, HubIdentity } from './model'
import type { Plan } from './plan-model'

// What the hub's stream has told the page, as pure steps: each frame's effect on what it holds.
// stream.ts owns the one instance and decodes each frame's payload before these see it.

export type HubPresence = { name: string; isOnline: boolean }

// The desks as listed: null until the first snapshot is whole, and the ids that arrived in the
// last change of the listing (a page load never reads as a wave of arrivals).
export type Listing = {
	desks: HubDesk[] | null
	arrivedIds: ReadonlySet<string>
}

export type StreamView = {
	stream: StreamState
	identity: HubIdentity | null
	hubs: ReadonlyMap<string, HubPresence>
	listing: Listing
	// Each live desk's latest pulse, as the wire carried it: the review entity decodes the one its
	// desk tab reads.
	pulses: ReadonlyMap<string, unknown>
	journal: JournalFollow
	// The plan library, the most recently moved plan first (as the hub lists it); null until the
	// first snapshot is whole.
	plans: Plan[] | null
	health: HubHealth | null
	// Counts the hub's hellos: a page that read something once and missed it reads again when the
	// hub speaks again.
	epoch: number
}

// A snapshot as it arrives between its hello and its snapshot-end, gathered apart: the page keeps
// what it held until the snapshot is whole, then takes it at once (a desk closed while the tab was
// away leaves, and the dashboard never flashes empty).
export type Snapshot = {
	hubId: string
	desks: Map<string, HubDesk>
	pulses: Map<string, unknown>
	tail: JournalEvent[]
	plans: Map<string, Plan>
}

const NO_ARRIVALS: ReadonlySet<string> = new Set()

export const FIRST_VIEW: StreamView = {
	stream: { link: { kind: 'connecting' }, lastClose: null },
	identity: null,
	hubs: new Map(),
	listing: { desks: null, arrivedIds: NO_ARRIVALS },
	pulses: new Map(),
	journal: FIRST_FOLLOW,
	plans: null,
	health: null,
	epoch: 0,
}

export function emptySnapshot(hubId: string): Snapshot {
	return {
		hubId,
		desks: new Map(),
		pulses: new Map(),
		tail: [],
		plans: new Map(),
	}
}

function arrivals(
	previous: readonly HubDesk[] | null,
	next: readonly HubDesk[],
): ReadonlySet<string> {
	if (!previous) return NO_ARRIVALS
	const known = new Set(previous.map(desk => desk.id))
	const arrived = next.filter(desk => !known.has(desk.id))
	return arrived.length ? new Set(arrived.map(desk => desk.id)) : NO_ARRIVALS
}

function listed(previous: Listing, desks: HubDesk[]): Listing {
	return { desks, arrivedIds: arrivals(previous.desks, desks) }
}

function byMove(plans: Iterable<Plan>): Plan[] {
	return [...plans].toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function greeted(view: StreamView, identity: HubIdentity): StreamView {
	const presence = { name: identity.name, isOnline: true }
	return {
		...view,
		identity,
		hubs: new Map([...view.hubs, [identity.id, presence]]),
		epoch: view.epoch + 1,
	}
}

export function withHub(
	view: StreamView,
	hub: { hubId: string; name: string; online: boolean },
): StreamView {
	const presence = { name: hub.name, isOnline: hub.online }
	return { ...view, hubs: new Map([...view.hubs, [hub.hubId, presence]]) }
}

export function settled(view: StreamView, snapshot: Snapshot): StreamView {
	return {
		...view,
		listing: listed(view.listing, [...snapshot.desks.values()]),
		pulses: snapshot.pulses,
		journal: tailed(view.journal, snapshot.hubId, snapshot.tail),
		plans: byMove(snapshot.plans.values()),
	}
}

// A desk opened (first in the listing, as the newest), or its summary changed in place.
export function withDesk(view: StreamView, desk: HubDesk): StreamView {
	const desks = view.listing.desks ?? []
	const at = desks.findIndex(each => each.id === desk.id)
	const next = at < 0 ? [desk, ...desks] : desks.with(at, desk)
	return { ...view, listing: listed(view.listing, next) }
}

// A desk closed: it leaves the listing with its pulse, and a plan it reviewed no longer links to
// its page.
export function withoutDesk(view: StreamView, deskId: string): StreamView {
	const desks = view.listing.desks ?? []
	const closing = desks.find(desk => desk.id === deskId)
	if (!closing) return view
	const pulses = new Map(view.pulses)
	pulses.delete(deskId)
	const unlinked = (plan: Plan): Plan =>
		plan.deskPath === closing.path ? { ...plan, deskPath: null } : plan
	return {
		...view,
		listing: listed(
			view.listing,
			desks.filter(desk => desk.id !== deskId),
		),
		pulses,
		plans: view.plans?.map(unlinked) ?? null,
	}
}

export function withPulse(
	view: StreamView,
	deskId: string,
	pulse: unknown,
): StreamView {
	return { ...view, pulses: new Map([...view.pulses, [deskId, pulse]]) }
}

export function withEvents(
	view: StreamView,
	hubId: string,
	events: readonly JournalEvent[],
): StreamView {
	const journal = followed(view.journal, hubId, events)
	return journal === view.journal ? view : { ...view, journal }
}

// A plan created or moved. One the page holds at a later move stays: a status change it adopted
// from its answer is never undone by a frame shaped before it.
export function withPlan(view: StreamView, plan: Plan): StreamView {
	const plans = view.plans ?? []
	const held = plans.find(each => each.id === plan.id)
	if (held && held.updatedAt > plan.updatedAt) return view
	const others = plans.filter(each => each.id !== plan.id)
	return { ...view, plans: byMove([plan, ...others]) }
}
