import { reviewScope } from './desk-summary.js'
import { errorMessage } from './errors.js'
import { createSerializer } from './mutex.js'
import { nowIso } from './time.js'

import type { ReviewResult } from '@syneva/contracts/agent'
import type {
	DeskSummary,
	HubEvent,
	HubEventSubject,
	HubJournalResponse,
} from '@syneva/contracts/hub'
import type { JournalEvent } from '../domain/hub-journal.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { ReviewState } from '../domain/review.js'
import type { DeskIdentity } from './desk-summary.js'
import type { HubJournalPort } from './ports.js'

// The tail the hub keeps in memory and serves: the dashboard reads recent activity and the
// history of live projects, never the hub's whole life.
const KEPT_EVENTS = 5000
// Compact the file once it holds twice the kept tail: rewriting it on every start would cost a
// full write each time, never compacting would make every start read a record nobody serves.
const COMPACT_GROWTH_FACTOR = 2
const COMPACT_AFTER_EVENTS = KEPT_EVENTS * COMPACT_GROWTH_FACTOR

type Unstamped<E> = E extends unknown ? Omit<E, 'seq' | 'at' | 'round'> : never
type Unsubjected<E> = E extends unknown
	? Omit<E, keyof HubEventSubject | 'round'>
	: never

// An event as a recording site knows it: all but what the journal stamps - the seq, the time,
// and a round's number, which only the journal's own history can count.
export type HubEventDraft = Unstamped<HubEvent>

// What a desk records about itself: the event minus the desk it is about, which the hub binds
// once per desk (adapters/inbound/http/hosted-desk.ts) - a route says what happened, never who.
export type DeskEventDraft = Unsubjected<HubEvent>

// GET /api/hub/journal, decoded: the events after `after` (0 reads the whole kept tail - seqs
// start at 1), at most `limit` of them.
export type JournalQuery = { after: number; limit: number }

// The hub's journal: what happened on the hub, in order (the HubEvent contract). One serialized
// queue owns it - the load, every append, every read - so seqs follow the order things were
// recorded in and a read sees every event recorded before it.
export type HubJournal = {
	// Fire-and-forget: a recording site never waits on the disk, and a failed write is logged,
	// never the failure of the request that recorded it.
	record(draft: HubEventDraft): void
	read(query: JournalQuery): Promise<HubJournalResponse>
}

export function createHubJournal(
	port: HubJournalPort,
	log: (line: string) => void,
): HubJournal {
	const kept: JournalEvent[] = []
	let latest = 0
	let isLoaded = false
	const serialize = createSerializer()
	// The file loads on first use, inside the queue, not at construction: only the hub that
	// bound the port serves a request, so a second `syneva start` that lost the race never
	// reads, let alone compacts, the journal the live hub appends to.
	async function loaded(): Promise<void> {
		if (isLoaded) return
		const tail = await loadTail(port, log)
		kept.push(...tail)
		latest = Math.max(0, ...tail.map(event => event.seq))
		isLoaded = true
	}
	// The event joins the kept tail only once it is on disk: a seq a reader saw is never handed
	// out again by a restarted hub. A failed append drops the event, and its seq with it.
	async function append(draft: HubEventDraft, at: string): Promise<void> {
		await loaded()
		const event = stamp(draft, { seq: latest + 1, at }, kept)
		try {
			await port.append(event)
		} catch (error) {
			log(`journal: ${draft.kind} not recorded: ${errorMessage(error)}`)
			return
		}
		latest = event.seq
		kept.push(event)
		if (kept.length > KEPT_EVENTS) kept.shift()
	}
	return {
		record(draft: HubEventDraft): void {
			// Stamped now, appended in turn: `at` is when it happened, not when the queue got to it.
			const at = nowIso()
			void serialize(() => append(draft, at))
		},
		read: query =>
			serialize(async () => {
				await loaded()
				return tailAfter(kept, latest, query)
			}),
	}
}

// The kept tail of the file (compacted to it when the file has outgrown it). An unreadable
// journal starts the hub empty - the journal is a record, never what the hub needs to run.
async function loadTail(
	port: HubJournalPort,
	log: (line: string) => void,
): Promise<JournalEvent[]> {
	let events: JournalEvent[]
	try {
		events = await port.load()
	} catch (error) {
		log(`journal: unreadable, starting empty: ${errorMessage(error)}`)
		return []
	}
	const tail = events.slice(-KEPT_EVENTS)
	if (events.length <= COMPACT_AFTER_EVENTS) return tail
	try {
		await port.rewrite(tail)
	} catch (error) {
		log(`journal: compaction failed: ${errorMessage(error)}`)
	}
	return tail
}

// A Send's `round` is 1-based per desk: one past the desk's latest send in the kept journal -
// its sends so far, this one included. Following the latest round rather than counting sends
// keeps the numbering monotonic once a compaction has trimmed the desk's earliest sends. A
// pickup carries the round it picked: the desk's latest send.
function stamp(
	draft: HubEventDraft,
	{ seq, at }: { seq: number; at: string },
	history: readonly JournalEvent[],
): HubEvent {
	if (draft.kind === 'round-sent')
		return {
			seq,
			at,
			...draft,
			round: lastRound(history, draft.deskId) + 1,
		}
	if (draft.kind === 'round-picked')
		return { seq, at, ...draft, round: lastRound(history, draft.deskId) }
	return { seq, at, ...draft }
}

// 0 when the kept journal holds no send for the desk.
function lastRound(history: readonly JournalEvent[], deskId: string): number {
	const sent = history.findLast(
		event => event.kind === 'round-sent' && event.deskId === deskId,
	)
	return sent?.kind === 'round-sent' ? sent.round : 0
}

// Oldest first; the newest `limit` when more follow `after`.
function tailAfter(
	kept: readonly JournalEvent[],
	latest: number,
	{ after, limit }: JournalQuery,
): HubJournalResponse {
	const following = kept.filter(event => event.seq > after)
	return { events: following.slice(-limit), latest }
}

// Who an event is about: the desk named as the hub lists it at that moment (deskIdentity), so an
// event outlives its desk (a closed desk's history still reads).
export function journalSubject(
	desk: DeskIdentity,
): Omit<HubEventSubject, 'seq' | 'at'> {
	return {
		deskId: desk.id,
		projectId: desk.projectId,
		project: desk.project,
		root: desk.root,
		session: desk.session,
		mode: desk.mode,
		target: desk.target,
		staged: desk.staged,
	}
}

// The reviewer's Send: its verdicts as the ReviewResult the agent receives counts them, over
// the review as it stood once the send committed.
export function roundSent(
	state: ReviewState,
	verdicts: ReviewResult,
): DeskEventDraft {
	return {
		kind: 'round-sent',
		...reviewScope(state),
		accepted: verdicts.accepted.length,
		rejected: verdicts.rejected.length,
		requestedChanges: verdicts.requestedChanges.length,
		openQuestions: verdicts.openQuestions.length,
		approvedFiles: verdicts.approvedFiles.length,
	}
}

// A desk leaving the hub: how far its review had come, as the listing counted it at the close,
// and the open parameters a reopen needs that its review state does not carry (the registry
// record's PR base and --path limit).
export function deskClosed(
	desk: DeskSummary,
	opened: Pick<HubDeskRecord, 'base' | 'pathFilter'>,
): DeskEventDraft {
	return {
		kind: 'desk-closed',
		files: desk.files,
		totalChanges: desk.totalChanges,
		approvedFiles: desk.approvedFiles,
		decidedChanges: desk.decidedChanges,
		base: opened.base,
		pathFilter: opened.pathFilter,
	}
}
