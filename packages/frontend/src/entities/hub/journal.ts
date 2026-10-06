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
			})

export type JournalKind = JournalEvent['kind']

export type RoundSent = Extract<JournalEvent, { kind: 'round-sent' }>
export type DeskClosed = Extract<JournalEvent, { kind: 'desk-closed' }>

// The journal as the dashboard holds it: the events it has read, oldest first, the newest seq
// the hub holds (what the next read asks to follow), and where the events that just arrived
// begin: the newest seq held before the last read that brought any, null while nothing has
// arrived since the first read (a page load never reads as a wave of arrivals).
export type Journal = {
	events: readonly JournalEvent[]
	latest: number
	freshAfter: number | null
	// Whether the first read has settled, answered or not; until then an empty journal says
	// nothing about the hub's history.
	isRead: boolean
}

export const EMPTY_JOURNAL: Journal = {
	events: [],
	latest: 0,
	freshAfter: null,
	isRead: false,
}

export function isRoundSent(event: JournalEvent): event is RoundSent {
	return event.kind === 'round-sent'
}

export function isDeskClosed(event: JournalEvent): event is DeskClosed {
	return event.kind === 'desk-closed'
}
