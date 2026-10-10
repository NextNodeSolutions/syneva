import { isAnswered } from './answered'
import { isDomainStale } from './guide/resolution'

import type { Guide, GuideDomain } from './guide/model'
import type {
	DomainCodeRef,
	DomainComment,
	DomainTarget,
	ReviewState,
} from './model'

export type DomainThread = {
	key: string
	target: DomainTarget
	kind: 'question' | 'comment'
	// resolved: no open message; answered: an agent reply landed after the question; open otherwise.
	status: 'open' | 'answered' | 'resolved'
	// The attached guide no longer has the target.
	unanchored: boolean
	// The target's domain is stale against the current diff (its explanation describes earlier code).
	stale: boolean
	messages: DomainComment[]
	updatedAt: string
}

const REFS_MAX = 20

// One thread per domain, or per block of it (the same key the hub and the Send use).
export function domainThreadKey(
	target: Pick<DomainTarget, 'domainId' | 'blockId'>,
): string {
	return JSON.stringify([target.domainId, target.blockId ?? ''])
}

// The references a block cites, else the domain's (a block may cite none), else the code the domain owns - the hub's own rule (domain-comments.ts targetRefs).
function blockRefs(
	domain: GuideDomain,
	blockId: string | undefined,
): DomainCodeRef[] {
	const references = domain.references ?? []
	const cited =
		domain.blocks.find(candidate => candidate.id === blockId)?.refs ?? []
	const pointed = cited.length
		? references.filter(reference => cited.includes(reference.id))
		: references
	if (pointed.length)
		return pointed.slice(0, REFS_MAX).map(reference => ({
			path: reference.path,
			side: reference.side,
			lineNumber: reference.lineNumber,
			endLine: reference.endLine,
			label: reference.label,
		}))
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

// The target as the guide describes it now (the same rule the hub applies on its side): the title and the code the explanation points at, kept on the comment so a later guide cannot move the thread.
export function domainTargetOf(
	guide: Guide | undefined,
	domainId: string,
	blockId: string | undefined,
): DomainTarget | null {
	const domain = guide?.domains.find(candidate => candidate.id === domainId)
	if (!guide || !domain) return null
	const block = blockId
		? domain.blocks.find(candidate => candidate.id === blockId)
		: undefined
	if (blockId && !block) return null
	return {
		guideFingerprint: guide.source.fingerprint,
		domainId: domain.id,
		blockId: block?.id,
		domainTitle: domain.title,
		blockTitle: block?.title,
		refs: blockRefs(domain, block?.id),
	}
}

// An open change request keeps the thread open whatever its question's state: the request is what the next Send carries.
function hasOpenRequest(messages: DomainComment[]): boolean {
	return messages.some(
		message =>
			message.status === 'open' &&
			message.role !== 'agent' &&
			message.intent === 'action',
	)
}

function threadStatus(
	messages: DomainComment[],
	kind: DomainThread['kind'],
): DomainThread['status'] {
	if (!messages.some(message => message.status === 'open')) return 'resolved'
	if (hasOpenRequest(messages)) return 'open'
	if (kind === 'question' && isAnswered(messages)) return 'answered'
	return 'open'
}

function threadOf(state: ReviewState, messages: DomainComment[]): DomainThread {
	const ordered = messages.toSorted(
		(a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
	)
	const [first] = ordered
	const last = ordered.at(-1) ?? first
	const kind = ordered.some(message => message.intent === 'question')
		? 'question'
		: 'comment'
	return {
		key: domainThreadKey(first?.target ?? { domainId: '' }),
		target: first?.target ?? {
			guideFingerprint: '',
			domainId: '',
			domainTitle: '',
			refs: [],
		},
		kind,
		status: threadStatus(ordered, kind),
		unanchored: ordered.some(message => message.unanchored === true),
		stale: first ? isDomainStale(state, first.target.domainId) : false,
		messages: ordered,
		updatedAt: last?.updatedAt ?? '',
	}
}

// The threads of one domain (its own and its blocks') or of the whole review, oldest first.
export function domainThreads(
	state: ReviewState | null,
	domainId?: string,
): DomainThread[] {
	if (!state) return []
	const groups = new Map<string, DomainComment[]>()
	for (const comment of state.domainComments) {
		if (domainId && comment.target.domainId !== domainId) continue
		const key = domainThreadKey(comment.target)
		const group = groups.get(key)
		if (group) group.push(comment)
		else groups.set(key, [comment])
	}
	return [...groups.values()]
		.map(messages => threadOf(state, messages))
		.toSorted(
			(a, b) =>
				+new Date(a.messages[0]?.createdAt ?? 0) -
				+new Date(b.messages[0]?.createdAt ?? 0),
		)
}

export function openDomainThreadCount(state: ReviewState | null): number {
	return domainThreads(state).filter(thread => thread.status !== 'resolved')
		.length
}
