import crypto from 'node:crypto'

import { newComment } from '../domain/comments.js'

import { commentContents } from './comments.js'
import { nowIso } from './time.js'

import type { CommentInput } from '../domain/comments.js'
import type { ReviewComment, ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'

export type AppendedComment = {
	// Copy-on-write: a new comments array, every other branch shared; the caller persists and commits it - the live state object is never edited in place.
	state: ReviewState
	comment: ReviewComment
}

// Capture the anchor text of the pointed-at line so a later reload can re-anchor the thread; fetching contents on demand works even when the tab never opened the file, a file resolving to nothing (deleted, index-only) still gets the comment (without anchor text), and whole-file comments skip the read.
// The record is immutable domain data built fresh; on the live path a failed read degrades to "no anchor text" instead of failing the round-trip.
export async function appendLiveComment(
	state: ReviewState,
	request: CommentInput,
	git: GitPort,
): Promise<AppendedComment> {
	const comment = newComment(
		request,
		await commentContents(state, request, git).catch(() => undefined),
		crypto.randomUUID(),
		nowIso(),
	)
	return {
		state: { ...state, comments: [...state.comments, comment] },
		comment,
	}
}
