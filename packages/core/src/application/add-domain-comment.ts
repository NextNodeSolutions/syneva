import crypto from 'node:crypto'

import { domainTarget, newDomainComment } from '../domain/domain-comments.js'

import { nowIso } from './time.js'

import type { DomainCommentInput } from '../domain/domain-comments.js'
import type { DomainComment, ReviewState } from '../domain/review.js'
import type { ReviewStorePort } from './ports.js'

export type DomainAppendOutcome =
	| { ok: true; state: ReviewState; comment: DomainComment }
	| { ok: false; reason: string }

// The target is read off the attached guide at this moment (title, refs) and refused when the guide has no such domain or block: the thread is born with the context it keeps. Copy-on-write like a line comment.
export function appendLiveDomainComment(
	state: ReviewState,
	input: DomainCommentInput,
): DomainAppendOutcome {
	if (!state.guide)
		return { ok: false, reason: 'This desk has no guide to comment on.' }
	const target = domainTarget(state.guide, input)
	if (!target)
		return {
			ok: false,
			reason: input.blockId
				? `The guide has no block "${input.blockId}" in domain "${input.domainId}".`
				: `The guide has no domain "${input.domainId}".`,
		}
	const comment = newDomainComment(
		input,
		target,
		crypto.randomUUID(),
		nowIso(),
	)
	return {
		ok: true,
		state: {
			...state,
			domainComments: [...(state.domainComments ?? []), comment],
		},
		comment,
	}
}

// The offline reply (no live desk): appended to the saved review for the desk's next open.
export async function appendDomainComment(
	root: string,
	session: string,
	input: DomainCommentInput,
	store: ReviewStorePort,
): Promise<DomainComment> {
	const saved = await store.loadLatestReview(root, session)
	if (!saved)
		throw new Error(
			`No saved review for session "${session}" in ${root}. Open the desk first.`,
		)
	const appended = appendLiveDomainComment(saved, input)
	if (!appended.ok) throw new Error(appended.reason)
	await store.persistReview(appended.state)
	return appended.comment
}
