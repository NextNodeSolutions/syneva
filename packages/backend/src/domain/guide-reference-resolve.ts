// Where a reference lands: a changed block of the inventory, or unchanged lines whose content the lifecycle read on the reviewed revision.
import { spanOverlaps } from './guide-ownership.js'
import { indexed } from './guide-parse.js'
import { hash } from './identity.js'

import type {
	GuideDomain,
	GuideIssue,
	GuideReference,
	ResolvedReference,
} from './guide-shapes.js'
import type { ReviewInventory } from './inventory.js'

// contextKey(domainId, refId) → the hash of the cited lines on the reviewed revision, or null when they do not exist (or could not be read within bounds).
export type ContextHashes = ReadonlyMap<string, string | null>

// Ids may hold ":" (domain "a:b" + ref "c" and domain "a" + ref "b:c" would collide) but never a NUL, so the pair stays unambiguous.
export function contextKey(domainId: string, refId: string): string {
	return `${domainId}\0${refId}`
}

function describe(reference: GuideReference): string {
	const end = reference.endLine ? `-${reference.endLine}` : ''
	return `${reference.path}:${reference.side}:${reference.lineNumber}${end}`
}

function resolveChangedReference(
	reference: GuideReference,
	inventory: ReviewInventory,
): ResolvedReference {
	const units = inventory.units.filter(
		candidate =>
			candidate.path === reference.path &&
			candidate.side === reference.side &&
			spanOverlaps(reference, candidate),
	)
	const [only] = units
	if (!only)
		return {
			status: 'unresolved',
			reason: `no changed block at ${describe(reference)}`,
		}
	// A span may cover several blocks: its identity is every one of them, so a rewrite of any block it cites reads stale.
	return {
		status: 'resolved',
		contentHash:
			units.length === 1
				? only.contentHash
				: hash(units.map(unit => unit.contentHash).join('\0')),
	}
}

function resolveContextReference(
	reference: GuideReference,
	cited: string | null | undefined,
): ResolvedReference {
	if (typeof cited !== 'string')
		return {
			status: 'unresolved',
			reason: `${describe(reference)} does not exist on the reviewed revision`,
		}
	return { status: 'resolved', contentHash: cited }
}

export function resolveReference(
	domain: GuideDomain,
	reference: GuideReference,
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): ResolvedReference {
	if (reference.role === 'changed')
		return resolveChangedReference(reference, inventory)
	return resolveContextReference(
		reference,
		contextHashes.get(contextKey(domain.id, reference.id)),
	)
}

// One domain's references; an unresolved one at attach is an issue naming its field.
function resolveDomainReferences(
	domain: GuideDomain,
	domainIndex: number,
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): { refs: Record<string, ResolvedReference>; issues: GuideIssue[] } {
	const refs: Record<string, ResolvedReference> = {}
	const issues: GuideIssue[] = []
	const where = `${indexed('guide.domains', domainIndex)}.references`
	for (const [refIndex, reference] of (domain.references ?? []).entries()) {
		const resolved = resolveReference(
			domain,
			reference,
			inventory,
			contextHashes,
		)
		refs[reference.id] = resolved
		if (resolved.status === 'resolved') continue
		issues.push({
			field: indexed(where, refIndex),
			target: describe(reference),
			reason: resolved.reason ?? 'unresolved',
		})
	}
	return { refs, issues }
}

// Every reference of every domain.
export function resolveReferences(
	domains: readonly GuideDomain[],
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): {
	byDomain: Map<string, Record<string, ResolvedReference>>
	issues: GuideIssue[]
} {
	const byDomain = new Map<string, Record<string, ResolvedReference>>()
	const issues: GuideIssue[] = []
	for (const [domainIndex, domain] of domains.entries()) {
		const resolved = resolveDomainReferences(
			domain,
			domainIndex,
			inventory,
			contextHashes,
		)
		byDomain.set(domain.id, resolved.refs)
		issues.push(...resolved.issues)
	}
	return { byDomain, issues }
}
