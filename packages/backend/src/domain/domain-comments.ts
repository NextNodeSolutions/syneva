import type { Guide, GuideDomain, GuideReference } from './guide-shapes.js'
import type { DomainCodeRef, DomainComment, DomainTarget } from './review.js'

// The reviewer's fields of a new domain comment, as posted by the pane, `syneva comment --domain` or the correspondent.
export type DomainCommentInput = {
	domainId: string
	blockId?: string | undefined
	body: string
	role: 'user' | 'agent'
}

const REFS_MAX = 20

function codeRef(reference: GuideReference): DomainCodeRef {
	return {
		path: reference.path,
		side: reference.side,
		lineNumber: reference.lineNumber,
		endLine: reference.endLine,
		label: reference.label,
	}
}

// The code a target points at when the comment is written: a block's own references, else the domain's references, else the code it owns - kept on the comment so a later guide cannot move the thread.
function targetRefs(
	domain: GuideDomain,
	blockId: string | undefined,
): DomainCodeRef[] {
	const references = domain.references ?? []
	const block = domain.blocks.find(candidate => candidate.id === blockId)
	const cited = block
		? references.filter(reference =>
				(block.refs ?? []).includes(reference.id),
			)
		: references
	if (cited.length) return cited.slice(0, REFS_MAX).map(codeRef)
	return domain.members
		.flatMap(member =>
			member.kind === 'change'
				? [
						{
							path: member.path,
							side: member.side,
							lineNumber: member.lineNumber,
							endLine: member.endLine,
						},
					]
				: [],
		)
		.slice(0, REFS_MAX)
}

// The target as the attached guide describes it now; null when the guide has no such domain, or the domain no such block - feedback never lands on a guess.
export function domainTarget(
	guide: Guide,
	input: Pick<DomainCommentInput, 'domainId' | 'blockId'>,
): DomainTarget | null {
	const domain = guide.domains.find(
		candidate => candidate.id === input.domainId,
	)
	if (!domain) return null
	const block = input.blockId
		? domain.blocks.find(candidate => candidate.id === input.blockId)
		: undefined
	if (input.blockId && !block) return null
	return {
		guideFingerprint: guide.source.fingerprint,
		domainId: domain.id,
		blockId: block?.id,
		domainTitle: domain.title,
		blockTitle: block?.title,
		refs: targetRefs(domain, block?.id),
	}
}

export function newDomainComment(
	input: DomainCommentInput,
	target: DomainTarget,
	id: string,
	now: string,
): DomainComment {
	return {
		id,
		target,
		body: input.body,
		createdAt: now,
		updatedAt: now,
		status: 'open',
		intent: 'note',
		role: input.role,
	}
}

// Blocks the handoff like a line request: open, the reviewer's, not a question.
export function isDomainRequest(comment: DomainComment): boolean {
	return (
		comment.status === 'open' &&
		comment.role !== 'agent' &&
		comment.intent !== 'question'
	)
}

// One thread per domain, or per block of it; the pair cannot collide as a JSON tuple.
export function domainThreadKey(
	target: Pick<DomainTarget, 'domainId' | 'blockId'>,
): string {
	return JSON.stringify([target.domainId, target.blockId ?? ''])
}

// After the guide changed: a thread whose domain (and block) still exists keeps its anchor - the ids are the stable identity across guides of one changeset - and one whose target is gone is marked with its context intact, never attached to another domain by title or position. No guide at all unanchors every thread.
export function reanchorDomainComments(
	comments: readonly DomainComment[],
	guide: Guide | undefined,
): DomainComment[] {
	return comments.map(comment => ({
		...comment,
		unanchored: !guide || domainTarget(guide, comment.target) === null,
	}))
}
