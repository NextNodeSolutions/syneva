import type { ReviewMode } from './model'

// Frontend-owned journal models: what the dashboard reads of the hub's record of rounds and
// desks. Declared structurally here (NOT re-exported from @contracts) so contract DTOs never
// escape the entity API boundary; journal-decode.ts maps the wire onto them. Keep structurally
// in sync with packages/contracts/src/hub.ts.

export type JournalSubject = {
	seq: number
	at: string
	deskId: string
	projectId: string
	project: string
	root: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
}

export type JournalScope = { files: number; totalChanges: number }

export type RoundVerdicts = {
	round: number
	accepted: number
	rejected: number
	requestedChanges: number
	openQuestions: number
	approvedFiles: number
}

export type JournalEvent =
	| (JournalSubject & JournalScope & { kind: 'desk-opened' })
	| (JournalSubject & JournalScope & { kind: 'desk-reloaded' })
	| (JournalSubject & JournalScope & RoundVerdicts & { kind: 'round-sent' })
	| (JournalSubject & { kind: 'round-picked'; round: number })
	| (JournalSubject & { kind: 'question-asked'; questions: number })
	| (JournalSubject & { kind: 'agent-replied' })
	| (JournalSubject &
			JournalScope & {
				kind: 'desk-closed'
				approvedFiles: number
				decidedChanges: number
				// What the desk was opened with beyond its subject (the PR base, the repo-mode path
				// limit), so a reopen rebuilds the same review.
				base?: string | undefined
				pathFilter?: string | undefined
			})

export type RoundSent = Extract<JournalEvent, { kind: 'round-sent' }>
export type DeskClosed = Extract<JournalEvent, { kind: 'desk-closed' }>

// The journal as the dashboard holds it: the events the stream brought, oldest first, and where
// the events that just arrived begin: the newest seq held before the last batch that brought
// any, null while nothing has arrived since the first snapshot (a page load never reads as a wave
// of arrivals).
export type Journal = {
	events: readonly JournalEvent[]
	freshAfter: number | null
	// Whether the first snapshot has settled; until then an empty journal says nothing about the
	// hub's history.
	isRead: boolean
}

export const EMPTY_JOURNAL: Journal = {
	events: [],
	freshAfter: null,
	isRead: false,
}

export function isRoundSent(event: JournalEvent): event is RoundSent {
	return event.kind === 'round-sent'
}

export function isDeskClosed(event: JournalEvent): event is DeskClosed {
	return event.kind === 'desk-closed'
}
