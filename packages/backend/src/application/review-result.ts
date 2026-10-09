import { commentAnchor, isRequestedChange } from '../domain/comments.js'
import {
	computeApprovedFiles,
	effectiveDecisions,
} from '../domain/decisions.js'
import { domainThreadKey, isDomainRequest } from '../domain/domain-comments.js'

import type {
	DomainQuestionPayload,
	LineQuestionPayload,
	QuestionPayload,
	ReviewResult,
} from '@syneva/contracts/agent'
import type {
	Decision,
	DomainComment,
	ReviewComment,
	ReviewState,
} from '../domain/review.js'

// Shared by /ask (live question event) and computeOpenQuestions (questions folded into a Send) so the two payload shapes can't drift; lineNumber 0 (whole-file) stamps anchor - the agent reads "file" instead of inferring it.
export function questionPayload(
	state: Pick<ReviewState, 'mode' | 'session'>,
	question: {
		path: string
		lineNumber: number
		side: 'additions' | 'deletions'
		body: string
	},
): LineQuestionPayload {
	return {
		path: question.path,
		lineNumber: question.lineNumber,
		side: question.side,
		body: question.body,
		anchor: commentAnchor(question.lineNumber),
		mode: state.mode,
		session: state.session,
	}
}

// A question on the guide: the target's context rides with it, so the agent reads the right explanation and code without the desk.
export function domainQuestionPayload(
	state: Pick<ReviewState, 'mode' | 'session'>,
	question: Pick<DomainComment, 'target' | 'body'>,
): DomainQuestionPayload {
	const { target } = question
	return {
		anchor: 'domain',
		domainId: target.domainId,
		blockId: target.blockId,
		domainTitle: target.domainTitle,
		blockTitle: target.blockTitle,
		guideFingerprint: target.guideFingerprint,
		refs: [...target.refs],
		body: question.body,
		mode: state.mode,
		session: state.session,
	}
}

// A path may contain any character, so a plain joined string could collide - the JSON tuple cannot.
const threadKey = (comment: ReviewComment): string =>
	JSON.stringify([comment.path, comment.side, comment.lineNumber])

type Threaded = Pick<ReviewComment, 'role' | 'intent' | 'status' | 'createdAt'>

// Mirrors the UI's "answered" heuristic (frontend diff-view/annotations.ts, entities/review/notes.ts): an open question stays unanswered until a later agent reply lands in the same thread - a line thread (path/side/line) or a domain thread (domain/block).
function unanswered<Item extends Threaded>(
	items: readonly Item[],
	keyOf: (item: Item) => string,
): Item[] {
	const latestReplies = new Map<string, number>()
	for (const reply of items) {
		if (reply.role !== 'agent') continue
		const repliedAt = +new Date(reply.createdAt)
		if (Number.isNaN(repliedAt)) continue
		const key = keyOf(reply)
		const latest = latestReplies.get(key)
		if (!latest || repliedAt > latest) latestReplies.set(key, repliedAt)
	}
	return items.filter(message => {
		if (message.intent !== 'question' || message.status !== 'open')
			return false
		if (message.role === 'agent') return false
		const latest = latestReplies.get(keyOf(message)) ?? 0
		return !(latest > +new Date(message.createdAt))
	})
}

// They ride out on the Send's ReviewResult so an agent without the live await still owes each an answer.
export function computeOpenQuestions(state: ReviewState): QuestionPayload[] {
	return [
		...unanswered(state.comments, threadKey).map(comment =>
			questionPayload(state, comment),
		),
		...unanswered(state.domainComments ?? [], comment =>
			domainThreadKey(comment.target),
		).map(comment => domainQuestionPayload(state, comment)),
	]
}

function domainRequests(state: ReviewState): ReviewResult['domainRequests'] {
	return (state.domainComments ?? [])
		.filter(isDomainRequest)
		.map(({ target, body }) => ({
			domainId: target.domainId,
			blockId: target.blockId,
			domainTitle: target.domainTitle,
			blockTitle: target.blockTitle,
			guideFingerprint: target.guideFingerprint,
			refs: [...target.refs],
			body,
		}))
}

export function buildReviewResult(
	state: ReviewState,
	artifacts: { resultJson: string; sessionDir: string },
	overallNote?: string,
): ReviewResult {
	return {
		session: state.session,
		repoRoot: state.root,
		mode: state.mode,
		target: state.target,
		base: state.base,
		staged: state.staged,
		head: state.head,
		baseDiffHash: state.baseDiffHash,
		accepted: decisionSummaries(state, 'accepted'),
		rejected: decisionSummaries(state, 'rejected'),
		requestedChanges: requestedChanges(state),
		domainRequests: domainRequests(state),
		...noteStamp(overallNote?.trim()),
		stagedFiles: state.stagedFiles,
		approvedFiles: computeApprovedFiles(state),
		openQuestions: computeOpenQuestions(state),
		artifacts,
	}
}

function decisionSummaries(
	state: ReviewState,
	status: Decision['status'],
): ReviewResult['accepted'] {
	return effectiveDecisions(state)
		.filter(decision => decision.status === status)
		.map(decision => ({
			path: decision.path,
			lineNumber: decision.lineNumber,
			side: decision.side,
			title: decision.title,
		}))
}

// Whole-file requests (the file-header comment) ride out as lineNumber 0 + anchor "file" - no line to edit, so the agent applies the remark to the file as a whole.
// Side keeps its additions placeholder (uniform array shape, same as the persisted record).
function requestedChanges(
	state: ReviewState,
): ReviewResult['requestedChanges'] {
	return state.comments.filter(isRequestedChange).map(comment => ({
		path: comment.path,
		lineNumber: comment.lineNumber,
		side: comment.side,
		body: comment.body,
		anchor: commentAnchor(comment.lineNumber),
	}))
}

// A blank overall note is left off the wire entirely - the agent contract prints `overallNote` only when the reviewer wrote one.
function noteStamp(note: string | undefined): { overallNote?: string } {
	if (!note) return {}
	return { overallNote: note }
}
