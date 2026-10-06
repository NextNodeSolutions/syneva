import path from 'node:path'

import { deskPagePath } from '@syneva/contracts/routes'

import { isRequestedChange } from '../domain/comments.js'
import { computeApprovedFiles } from '../domain/decisions.js'
import { projectId } from '../domain/identity.js'

import { computeOpenQuestions } from './review-result.js'

import type { DeskStatus } from '@syneva/contracts/browser'
import type { DeskSummary, HubEventScope } from '@syneva/contracts/hub'
import type { ReviewState } from '../domain/review.js'

export type DeskClock = { openedAt: string; lastActivityAt: string }

export type DeskIdentity = Pick<
	DeskSummary,
	| 'id'
	| 'root'
	| 'project'
	| 'projectId'
	| 'session'
	| 'mode'
	| 'target'
	| 'staged'
>

// One name for a desk everywhere: what the listing shows and what journalSubject records.
export function deskIdentity(id: string, state: ReviewState): DeskIdentity {
	return {
		id,
		root: state.root,
		project: path.basename(state.root) || state.root,
		projectId: projectId(state.root),
		session: state.session,
		mode: state.mode,
		target: state.target,
		staged: state.staged,
	}
}

// The dashboard's projection of one desk: identity, counts and liveness, mapped field by field like browserState.
// The review's diff bodies and records never ride the hub listing.
export function deskSummary(
	id: string,
	state: ReviewState,
	status: DeskStatus,
	clock: DeskClock,
): DeskSummary {
	return {
		...deskIdentity(id, state),
		baseDiffHash: state.baseDiffHash,
		empty: !state.files.length,
		...reviewScope(state),
		approvedFiles: computeApprovedFiles(state).length,
		decidedChanges: state.changes.filter(
			change => change.status !== 'pending',
		).length,
		openQuestions: computeOpenQuestions(state).length,
		openRequests: state.comments.filter(isRequestedChange).length,
		agentListening: status.agentListening,
		agentActivity: status.agentActivity,
		queuedQuestions: status.queuedQuestions,
		queuedReviews: status.queuedReviews,
		openedAt: clock.openedAt,
		lastActivityAt: clock.lastActivityAt,
		path: deskPagePath(id),
	}
}

// The size of a desk's review: what the listing shows, and what a journal event records the
// review at when it happens (application/journal.ts) - one count, so the two never disagree.
export function reviewScope(state: ReviewState): HubEventScope {
	return { files: state.files.length, totalChanges: state.changes.length }
}
