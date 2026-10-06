// The hub journal's persisted lines (~/.syneva/hub/journal.jsonl): what happened on the hub,
// one event per line in seq order. Domain owns the shape and its decode: like the registry
// (hub-registry.ts), a line is persisted bytes shaped field by field before anything trusts it,
// and a line that is not a complete event decodes to null - skipped, never fatal, so a torn
// line (a crash mid-append) or a foreign one costs that line and not the journal.
//
// JournalEvent is a structural mirror of packages/contracts/src/hub.ts (HubEvent): domain may
// not import contracts. The application journal assigns one to the other in both directions
// (application/journal.ts), so the compiler keeps the two in sync.

import { isMode, nonEmptyString, optionalString } from './hub-registry.js'

import type { ReviewMode } from './review.js'

type EventSubject = {
	readonly seq: number
	readonly at: string
	readonly deskId: string
	readonly projectId: string
	readonly project: string
	readonly root: string
	readonly session: string
	readonly mode: ReviewMode
	readonly target?: string | undefined
	readonly staged: boolean
}

type EventScope = {
	readonly files: number
	readonly totalChanges: number
}

type RoundTally = {
	readonly round: number
	readonly accepted: number
	readonly rejected: number
	readonly requestedChanges: number
	readonly openQuestions: number
	readonly approvedFiles: number
}

type DeskProgress = {
	readonly approvedFiles: number
	readonly decidedChanges: number
}

// What a reopen needs beyond the subject: the PR base and the repo-mode path limit the desk was
// opened with (hub-registry.ts HubDeskRecord), which the review state does not carry.
type DeskOpening = {
	readonly base?: string | undefined
	readonly pathFilter?: string | undefined
}

export type JournalEvent =
	| (EventSubject & EventScope & { readonly kind: 'desk-opened' })
	| (EventSubject & EventScope & { readonly kind: 'desk-reloaded' })
	| (EventSubject & EventScope & RoundTally & { readonly kind: 'round-sent' })
	| (EventSubject & { readonly kind: 'round-picked'; readonly round: number })
	| (EventSubject & {
			readonly kind: 'question-asked'
			readonly questions: number
	  })
	| (EventSubject & { readonly kind: 'agent-replied' })
	| (EventSubject &
			EventScope &
			DeskProgress &
			DeskOpening & { readonly kind: 'desk-closed' })

const SCOPE_COUNTS = ['files', 'totalChanges'] as const
const ROUND_SENT_COUNTS = [
	...SCOPE_COUNTS,
	'round',
	'accepted',
	'rejected',
	'requestedChanges',
	'openQuestions',
	'approvedFiles',
] as const
const DESK_CLOSED_COUNTS = [
	...SCOPE_COUNTS,
	'approvedFiles',
	'decidedChanges',
] as const

// One journal line's parsed JSON, or null when it is not an event the hub wrote.
export function decodeJournalEvent(raw: unknown): JournalEvent | null {
	if (typeof raw !== 'object' || raw === null) return null
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(raw),
	)
	const subject = decodeSubject(record)
	if (!subject) return null
	return decodeVariant(subject, record)
}

// A seq is 1-based (the journal's first event is 1), so 0 is as malformed as a missing one.
function decodeSubject(record: Record<string, unknown>): EventSubject | null {
	const seq = countOf(record.seq)
	const at = nonEmptyString(record.at)
	const deskId = nonEmptyString(record.deskId)
	const projectId = nonEmptyString(record.projectId)
	const project = nonEmptyString(record.project)
	const root = nonEmptyString(record.root)
	const session = nonEmptyString(record.session)
	const { mode } = record
	if (!seq || !at || !deskId || !projectId || !project || !root || !session)
		return null
	if (!isMode(mode)) return null
	return {
		seq,
		at,
		deskId,
		projectId,
		project,
		root,
		session,
		mode,
		target: optionalString(record.target),
		staged: record.staged === true,
	}
}

// The kind and its own counts, each a non-negative integer: a kind this hub never wrote, or a
// count that is missing or malformed, is not an event.
function decodeVariant(
	subject: EventSubject,
	record: Record<string, unknown>,
): JournalEvent | null {
	const { kind } = record
	if (
		(kind === 'desk-opened' || kind === 'desk-reloaded') &&
		hasCounts(record, SCOPE_COUNTS)
	)
		return { ...subject, kind, ...scopeOf(record) }
	if (kind === 'round-sent' && hasCounts(record, ROUND_SENT_COUNTS))
		return {
			...subject,
			kind,
			...scopeOf(record),
			round: record.round,
			accepted: record.accepted,
			rejected: record.rejected,
			requestedChanges: record.requestedChanges,
			openQuestions: record.openQuestions,
			approvedFiles: record.approvedFiles,
		}
	if (kind === 'round-picked' && hasCounts(record, ['round']))
		return { ...subject, kind, round: record.round }
	if (kind === 'question-asked' && hasCounts(record, ['questions']))
		return { ...subject, kind, questions: record.questions }
	if (kind === 'agent-replied') return { ...subject, kind }
	if (kind === 'desk-closed' && hasCounts(record, DESK_CLOSED_COUNTS))
		return {
			...subject,
			kind,
			...scopeOf(record),
			approvedFiles: record.approvedFiles,
			decidedChanges: record.decidedChanges,
			base: optionalString(record.base),
			pathFilter: optionalString(record.pathFilter),
		}
	return null
}

function scopeOf(
	record: Record<(typeof SCOPE_COUNTS)[number], number>,
): EventScope {
	return { files: record.files, totalChanges: record.totalChanges }
}

function countOf(raw: unknown): number | null {
	if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0)
		return null
	return raw
}

// Narrows the record once every named field is checked as a count, so the variant reads them
// as numbers without a cast.
function hasCounts<K extends string>(
	record: Record<string, unknown>,
	keys: readonly K[],
): record is Record<string, unknown> & Record<K, number> {
	return keys.every(key => countOf(record[key]) !== null)
}
