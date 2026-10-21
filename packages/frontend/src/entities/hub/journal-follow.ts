import { JOURNAL_READ_MAX } from '@syneva/contracts/routes'

import { EMPTY_JOURNAL } from './journal'

import type { Journal, JournalEvent } from './journal'

// The journal as the stream feeds it. Events are keyed by (hubId, seq), the hub's own seq: each
// hub's events arrive in seq order, so the newest seq read per hub is the key set, and an event
// at or under it is one the page holds (a snapshot's tail replayed after a reconnect). Nothing
// here invents a cursor.
//
// On the web the page follows several hubs at once: their seqs overlap, so what "arrived since"
// means is the page's own ordinal (`heard`, counted here), and the events stay in the order they
// happened (`at`) whichever hub's frame brought them.
//
// The page keeps the newest JOURNAL_READ_MAX events: weeks of a busy hub, bounded so a long-open
// tab never grows without end. A first snapshot brings the hub's tail; the rest builds up as the
// hub records it.
export type JournalFollow = {
	journal: Journal
	newest: ReadonlyMap<string, number>
	// The last ordinal handed to an event.
	heard: number
}

export const FIRST_FOLLOW: JournalFollow = {
	journal: EMPTY_JOURNAL,
	newest: new Map(),
	heard: 0,
}

function newestOf(events: readonly JournalEvent[], fallback: number): number {
	return events.at(-1)?.seq ?? fallback
}

function stamped(
	events: readonly JournalEvent[],
	after: number,
): JournalEvent[] {
	return events.map((event, at) => ({ ...event, heard: after + at + 1 }))
}

// Events that happened after the held ones just follow them; one hub's older tail (another hub
// said hello after this one) slots in by time.
function merged(
	held: readonly JournalEvent[],
	added: readonly JournalEvent[],
): JournalEvent[] {
	const last = held.at(-1)
	const first = added.at(0)
	const isInOrder = !last || !first || first.at >= last.at
	const all = [...held, ...added]
	const ordered = isInOrder
		? all
		: all.toSorted((a, b) => a.at.localeCompare(b.at))
	return ordered.slice(-JOURNAL_READ_MAX)
}

// One hub's tail takes the place of what the page held of that hub (a page load, a hub never
// heard of, or a hub whose journal started over); the other hubs' events stay. The tail is that
// hub's history, not news, whenever it comes: a hub that joins after the page has heard others
// arrive must not wash its whole journal past their fresh line. So it keeps the `heard` of an
// event the page never saw arrive (0), under any line, and hands out no ordinal.
function replaced(
	held: JournalFollow,
	hubId: string,
	tail: readonly JournalEvent[],
): JournalFollow {
	const others = held.journal.events.filter(event => event.hubId !== hubId)
	const history = tail.map(event => ({ ...event, heard: 0 }))
	return {
		journal: {
			events: merged(others, history),
			freshAfter: held.journal.freshAfter,
			isRead: true,
		},
		newest: new Map([...held.newest, [hubId, newestOf(tail, 0)]]),
		heard: held.heard,
	}
}

// Events the hub recorded since the page last heard from it: those past its newest join the
// journal, and arrive (the wash starts after what the page held).
export function followed(
	held: JournalFollow,
	hubId: string,
	events: readonly JournalEvent[],
): JournalFollow {
	const newest = held.newest.get(hubId) ?? 0
	const fresh = events.filter(event => event.seq > newest)
	if (!fresh.length) return held
	return {
		journal: {
			events: merged(held.journal.events, stamped(fresh, held.heard)),
			freshAfter: held.heard,
			isRead: true,
		},
		newest: new Map([...held.newest, [hubId, newestOf(fresh, newest)]]),
		heard: held.heard + fresh.length,
	}
}

// A hub the page no longer follows (the web stopped listing it): its events leave with it.
export function unfollowed(held: JournalFollow, hubId: string): JournalFollow {
	if (!held.newest.has(hubId)) return held
	const newest = new Map(held.newest)
	newest.delete(hubId)
	const events = held.journal.events.filter(event => event.hubId !== hubId)
	return { ...held, journal: { ...held.journal, events }, newest }
}

// A snapshot's tail. The first one a hub brings is its journal as it stood. After a reconnect,
// what the hub recorded while the tab was away arrives like any event; a tail that ends before
// what the page holds means the hub's journal started over (its file removed), and it is read
// whole again.
export function tailed(
	held: JournalFollow,
	hubId: string,
	tail: readonly JournalEvent[],
): JournalFollow {
	const newest = held.newest.get(hubId) ?? 0
	if (!held.newest.has(hubId) || newestOf(tail, 0) < newest)
		return replaced(held, hubId, tail)
	return followed(held, hubId, tail)
}
