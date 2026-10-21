import { JOURNAL_READ_MAX } from '@syneva/contracts/routes'

import { EMPTY_JOURNAL } from './journal'

import type { Journal, JournalEvent } from './journal'

// The journal as the stream feeds it. Events are keyed by (hubId, seq), the hub's own seq: each
// hub's events arrive in seq order, so the newest seq read per hub is the key set, and an event
// at or under it is one the page holds (a snapshot's tail replayed after a reconnect). Nothing
// here invents a cursor.
//
// The page keeps the newest JOURNAL_READ_MAX events: weeks of a busy hub, bounded so a long-open
// tab never grows without end. A first snapshot brings the hub's tail; the rest builds up as the
// hub records it.
export type JournalFollow = {
	journal: Journal
	newest: ReadonlyMap<string, number>
}

export const FIRST_FOLLOW: JournalFollow = {
	journal: EMPTY_JOURNAL,
	newest: new Map(),
}

function newestOf(events: readonly JournalEvent[], fallback: number): number {
	return events.at(-1)?.seq ?? fallback
}

// The journal as one hub's tail states it: nothing in it arrived (a page load, or a hub whose
// journal started over).
function readWhole(
	hubId: string,
	tail: readonly JournalEvent[],
): JournalFollow {
	return {
		journal: {
			events: tail.slice(-JOURNAL_READ_MAX),
			freshAfter: null,
			isRead: true,
		},
		newest: new Map([[hubId, newestOf(tail, 0)]]),
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
			events: [...held.journal.events, ...fresh].slice(-JOURNAL_READ_MAX),
			freshAfter: newest,
			isRead: true,
		},
		newest: new Map([...held.newest, [hubId, newestOf(fresh, newest)]]),
	}
}

// A snapshot's tail. The first one is the journal as it stood. After a reconnect, what the hub
// recorded while the tab was away arrives like any event; a tail that ends before what the page
// holds means the hub's journal started over (its file removed), and it is read whole again.
// The local hub is the stream's one hub, so starting over replaces the whole journal.
export function tailed(
	held: JournalFollow,
	hubId: string,
	tail: readonly JournalEvent[],
): JournalFollow {
	const newest = held.newest.get(hubId) ?? 0
	if (!held.journal.isRead || newestOf(tail, 0) < newest)
		return readWhole(hubId, tail)
	return followed(held, hubId, tail)
}
