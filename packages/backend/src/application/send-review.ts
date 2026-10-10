import path from 'node:path'

import { readStagedSnapshot } from './reconcile.js'
import { buildReviewResult } from './review-result.js'

import type { ReviewResult } from '@syneva/contracts/agent'
import type { ReviewerSave } from '@syneva/contracts/browser'
import type {
	Decision,
	DomainComment,
	ReviewComment,
	ReviewState,
} from '../domain/review.js'
import type { GitPort, ReviewStorePort } from './ports.js'

const JSON_INDENT = 2

export type SentReview = {
	state: ReviewState
	resultJson: string
	reviewResult: ReviewResult
}

// The inbound route's DTO decode (parseReviewerSave, keyed off reviewerSavePatch) already shaped the raw body into these domain records - a malformed patch is refused there (422), never applied.
// Absent keys are untouched (snapshot semantics: a stale open tab may POST the whole old ReviewState).
export type ReviewerSavePatch = {
	decisions?: Decision[] | undefined
	comments?: ReviewComment[] | undefined
	domainComments?: DomainComment[] | undefined
	reviewedFiles?: string[] | undefined
	reviewedFileHashes?: Record<string, string> | undefined
	decisionFiles?: string[] | undefined
}

// Only these fields are mutated from the browser; everything else stays server-authoritative. Picking (rather than assigning the raw body) is what lets a stale open tab keep working.
// This key policy is THE single source - the inbound transport decodes exactly these keys off it.
const REVIEWER_SAVE_KEYS = [
	'decisions',
	'comments',
	'domainComments',
	'reviewedFiles',
	'reviewedFileHashes',
	'decisionFiles',
] as const satisfies ReadonlyArray<keyof ReviewerSave>

// The KEY-level allowlist for the slice; record-level DTO validation lives with the inbound transport (parseReviewerSave).
export function reviewerSavePatch(body: unknown): Record<string, unknown> {
	if (!body || typeof body !== 'object') return {}
	const posted: Record<string, unknown> = { ...body }
	return Object.fromEntries(
		REVIEWER_SAVE_KEYS.filter(key => posted[key] !== undefined).map(key => [
			key,
			posted[key],
		]),
	)
}

type AgentAuthored = { id: string; role?: 'user' | 'agent' | undefined }

// A reply the browser has not polled yet is not the reviewer's to drop: the posted slice is the reviewer's copy of each thread, and the desk's agent messages missing from it (by id) ride along, so an answer landing between a poll and a save or Send survives both and never rides out as an open question again. The reviewer deletes only their own messages, so an agent message absent from the copy is one it never saw.
function keepAgentMessages<Message extends AgentAuthored>(
	posted: readonly Message[],
	live: readonly Message[] | undefined,
): Message[] {
	const postedIds = new Set(posted.map(message => message.id))
	const unseen = (live ?? []).filter(
		message => message.role === 'agent' && !postedIds.has(message.id),
	)
	return [...posted, ...unseen]
}

// Only PRESENT keys replace - absent keys mean "unchanged" - and each key is spelled against ReviewState, so no raw or unknown patch can ever reach the state. The two thread keys keep the desk's agent messages on top of the copy.
export function applyReviewerSave(
	state: ReviewState,
	patch: ReviewerSavePatch,
): ReviewState {
	return {
		...state,
		decisions: patch.decisions ?? state.decisions,
		comments: patch.comments
			? keepAgentMessages(patch.comments, state.comments)
			: state.comments,
		domainComments: patch.domainComments
			? keepAgentMessages(patch.domainComments, state.domainComments)
			: state.domainComments,
		reviewedFiles: patch.reviewedFiles ?? state.reviewedFiles,
		reviewedFileHashes:
			patch.reviewedFileHashes ?? state.reviewedFileHashes,
		decisionFiles: patch.decisionFiles ?? state.decisionFiles,
	}
}

export type SendIo = { git: GitPort; store: ReviewStorePort }

export type SendInput = { patch: ReviewerSavePatch; overallNote: string }

// Building the result is what the agent contract hands over; emitting the review event is the caller's job, and only after the reviewer's response has flushed.
export async function sendReview(
	state: ReviewState,
	io: SendIo,
	input: SendInput,
): Promise<SentReview> {
	const merged = applyReviewerSave(state, input.patch)
	const snapshot = await readStagedSnapshot(merged, io.git)
	const persisted = await io.store.persistReview({ ...merged, ...snapshot })
	const saved: ReviewState = {
		...merged,
		...snapshot,
		...persisted.stamp,
	}
	const sessionDir = path.dirname(persisted.file)
	const resultJson = path.join(sessionDir, `${saved.id}-result.json`)
	const reviewResult = buildReviewResult(
		saved,
		{ resultJson, sessionDir },
		input.overallNote,
	)
	await io.store.writeFileAtomic(
		resultJson,
		`${JSON.stringify(reviewResult, null, JSON_INDENT)}\n`,
	)
	return { state: saved, resultJson, reviewResult }
}
