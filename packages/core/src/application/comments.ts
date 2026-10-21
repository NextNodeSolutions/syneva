import crypto from 'node:crypto'

import { isFileLevelLine, newComment } from '../domain/comments.js'

import { readFileContents } from './contents.js'
import { nowIso } from './time.js'

import type { CommentInput } from '../domain/comments.js'
import type { FileContents } from '../domain/contents.js'
import type { ReviewComment, ReviewState } from '../domain/review.js'
import type { GitPort, ReviewStorePort } from './ports.js'

export type CommentIo = { store: ReviewStorePort; git: GitPort }

// The one conditional contents read a new comment needs (line comments capture the anchor line; the state embeds none); shared by the offline and the live path.
export async function commentContents(
	state: ReviewState,
	input: CommentInput,
	git: GitPort,
): Promise<FileContents | undefined> {
	const file = state.files.find(candidate => candidate.path === input.path)
	if (!file || isFileLevelLine(input.lineNumber)) return undefined
	return await readFileContents(state, file, git)
}

export async function appendComment(
	root: string,
	session: string,
	input: CommentInput,
	io: CommentIo,
): Promise<ReviewComment> {
	const saved = await io.store.loadLatestReview(root, session)
	if (!saved)
		throw new Error(
			`No saved review for session "${session}" in ${root}. Open the desk first.`,
		)
	const comment = newComment(
		input,
		await commentContents(saved, input, io.git),
		crypto.randomUUID(),
		nowIso(),
	)
	await io.store.persistReview({
		...saved,
		comments: [...saved.comments, comment],
	})
	return comment
}
