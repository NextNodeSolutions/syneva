import { hubOfId } from './hub-ids'
import { FIRST_FOLLOW, followed, tailed } from './journal-follow'
import { modeOfHubId } from './mode'

import type { StreamState } from '@shared/api/stream'
import type { JournalEvent } from './journal'
import type { JournalFollow } from './journal-follow'
import type { HubMode } from './mode'
import type { HubDesk, HubHealth, HubIdentity, HubRef } from './model'
import type { HubPairing } from './pairing'
import type { Plan } from './plan-model'

// What the hub's stream has told the page, as pure steps: each frame's effect on what it holds.
// stream.ts owns the one instance and decodes each frame's payload before these see it.
//
// The page follows one hub when it is served by a local hub and several on the web, where each
// hub says hello and brings its own snapshot: a snapshot replaces what the page holds of its hub
// alone, so a hub that is offline keeps its desks (greyed, with the hub's tone) until it speaks
// again.

// The desks as listed: null until the first snapshot is whole, and the ids that arrived in the
// last change of the listing (a page load never reads as a wave of arrivals).
export type Listing = {
	desks: HubDesk[] | null
	arrivedIds: ReadonlySet<string>
}

export type StreamView = {
	stream: StreamState
	// The hub that last said hello: the one hub of a local page, the latest of several on the web.
	identity: HubIdentity | null
	// Every hub the page has heard of, by id, from its hello or the web's `hub` frame.
	hubs: ReadonlyMap<string, HubRef>
	// Local or web (mode.ts), null until a frame says.
	mode: HubMode | null
	// The hubs whose snapshot has been whole at least once on this page: a desk is known to be gone
	// only from a hub that has said what it holds.
	settledHubs: ReadonlySet<string>
	listing: Listing
	// Each live desk's latest pulse, as the wire carried it: the review entity decodes the one its
	// desk tab reads.
	pulses: ReadonlyMap<string, unknown>
	journal: JournalFollow
	// The plan library, the most recently moved plan first (as the hub lists it); null until the
	// first snapshot is whole.
	plans: Plan[] | null
	health: HubHealth | null
	// The hub's pairing with the web, as its last `pairing` frame said it.
	pairing: HubPairing | null
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
	mode: null,
	settledHubs: new Set(),
	listing: { desks: null, arrivedIds: NO_ARRIVALS },
	pulses: new Map(),
	journal: FIRST_FOLLOW,
	plans: null,
	health: null,
	pairing: null,
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

// A desk with its hub as the stream describes it: on the web only (the local hub is the page's
// own and a local desk names none). A desk keeps its identity when its hub did not change.
function resolved(
	desk: HubDesk,
	hubs: ReadonlyMap<string, HubRef>,
	mode: HubMode | null,
): HubDesk {
	const hub = mode === 'web' ? (hubs.get(desk.hubId) ?? null) : null
	return hub === desk.hub ? desk : { ...desk, hub }
}

// The listing after a hub's description moved: its desks read the new one, the others are kept.
function rehubbed(view: StreamView): StreamView {
	const { desks } = view.listing
	if (!desks) return view
	const next = desks.map(desk => resolved(desk, view.hubs, view.mode))
	if (next.every((desk, at) => desk === desks[at])) return view
	return { ...view, listing: { ...view.listing, desks: next } }
}

export function greeted(view: StreamView, identity: HubIdentity): StreamView {
	const known = view.hubs.get(identity.id)
	const hub: HubRef = {
		id: identity.id,
		name: identity.name,
		isOnline: true,
		version: identity.version,
		lastSeenAt: known?.lastSeenAt ?? null,
	}
	return rehubbed({
		...view,
		identity,
		hubs: new Map([...view.hubs, [identity.id, hub]]),
		mode: view.mode ?? modeOfHubId(identity.id),
		epoch: view.epoch + 1,
	})
}

// A person whose hubs are all offline gets no hello and no snapshot, so the page would wait for a
// listing for ever: with every hub it knows offline, the listing is whole, and empty. A hub that
// comes online brings its own snapshot over it.
export function settledEmpty(view: StreamView): StreamView {
	if (view.listing.desks || view.mode !== 'web') return view
	if ([...view.hubs.values()].some(hub => hub.isOnline)) return view
	return {
		...view,
		listing: { desks: [], arrivedIds: NO_ARRIVALS },
		plans: view.plans ?? [],
		journal: {
			...view.journal,
			journal: { ...view.journal.journal, isRead: true },
		},
	}
}

// The web's `hub` frame: where one of the person's hubs stands. A hub that just went offline is
// last seen now when the web does not say otherwise.
export function withHub(
	view: StreamView,
	hub: Omit<HubRef, 'id'> & { hubId: string },
	now: number,
): StreamView {
	const known = view.hubs.get(hub.hubId)
	const lastSeenAt =
		hub.lastSeenAt ??
		(known?.isOnline && !hub.isOnline ? now : (known?.lastSeenAt ?? null))
	const next: HubRef = {
		id: hub.hubId,
		name: hub.name,
		isOnline: hub.isOnline,
		version: hub.version ?? known?.version ?? null,
		lastSeenAt,
	}
	return settledEmpty(
		rehubbed({
			...view,
			hubs: new Map([...view.hubs, [hub.hubId, next]]),
			mode: 'web',
		}),
	)
}

// A hub's snapshot is whole: it replaces what the page held of that hub (its desks, pulses, plans
// and journal) and leaves the other hubs' as they are.
export function settled(view: StreamView, snapshot: Snapshot): StreamView {
	const isOther = (id: string): boolean => hubOfId(id) !== snapshot.hubId
	const kept = (view.listing.desks ?? []).filter(
		desk => desk.hubId !== snapshot.hubId,
	)
	const desks = [...snapshot.desks.values()].map(desk =>
		resolved(desk, view.hubs, view.mode),
	)
	const next = listed(view.listing, [...desks, ...kept])
	// A hub's first snapshot after the page's first listing is a hub arriving, not desks opening.
	const arrivedIds = view.settledHubs.has(snapshot.hubId)
		? next.arrivedIds
		: NO_ARRIVALS
	const pulses = new Map([...view.pulses].filter(([id]) => isOther(id)))
	for (const [id, pulse] of snapshot.pulses) pulses.set(id, pulse)
	const plans = (view.plans ?? []).filter(plan => isOther(plan.id))
	return {
		...view,
		settledHubs: new Set([...view.settledHubs, snapshot.hubId]),
		listing: { ...next, arrivedIds },
		pulses,
		journal: tailed(view.journal, snapshot.hubId, snapshot.tail),
		plans: byMove([...plans, ...snapshot.plans.values()]),
	}
}

// A desk opened (first in the listing, as the newest), or its summary changed in place.
export function withDesk(view: StreamView, desk: HubDesk): StreamView {
	const desks = view.listing.desks ?? []
	const next = resolved(desk, view.hubs, view.mode)
	const at = desks.findIndex(each => each.id === desk.id)
	const all = at < 0 ? [next, ...desks] : desks.with(at, next)
	return { ...view, listing: listed(view.listing, all) }
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
