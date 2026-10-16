import { spanOverlaps } from '@syneva/contracts/guide'

import { orderedDomains } from './domains'

import type { ChangeState, ReviewState } from '../model'
import type {
	CodeSpan,
	GuideDomain,
	GuideReference,
	ReferenceStatus,
} from './model'

// The desk's side of the resolution: the changes a domain owns NOW (its members over the live change records, the same overlap rule the hub applies), its progress from their verdicts alone, and what the hub marked stale or unassigned.

export function domainChanges(
	domain: GuideDomain,
	changes: readonly ChangeState[],
): ChangeState[] {
	return changes.filter(change =>
		domain.members.some(
			member =>
				member.kind === 'change' &&
				member.path === change.path &&
				member.side === change.side &&
				spanOverlaps(member, change),
		),
	)
}

export type DomainProgress = {
	total: number
	decided: number
	rejected: number
}

// Reading prose or a diagram decides nothing: progress counts the owned changes' verdicts only.
export function domainProgress(
	domain: GuideDomain,
	changes: readonly ChangeState[],
): DomainProgress {
	const owned = domainChanges(domain, changes)
	return {
		total: owned.length,
		decided: owned.filter(change => change.status !== 'pending').length,
		rejected: owned.filter(change => change.status === 'rejected').length,
	}
}

export function isDomainStale(
	state: ReviewState | null,
	domainId: string,
): boolean {
	return !!state?.guideResolution?.domains[domainId]?.stale
}

export function staleReasons(
	state: ReviewState | null,
	domainId: string,
): string[] {
	return state?.guideResolution?.domains[domainId]?.stale?.reasons ?? []
}

export function anyDomainStale(state: ReviewState | null): boolean {
	return Object.values(state?.guideResolution?.domains ?? {}).some(
		domain => domain.stale,
	)
}

export function referenceStatus(
	state: ReviewState | null,
	domainId: string,
	refId: string,
): { status: ReferenceStatus; reason?: string | undefined } {
	const resolved = state?.guideResolution?.domains[domainId]?.refs[refId]
	if (!resolved) return { status: 'unresolved', reason: 'not resolved yet' }
	return { status: resolved.status, reason: resolved.reason }
}

// The changes no domain owns after a reload: pending work the navigator and the overview list honestly rather than fold into a domain.
export function unassignedChanges(state: ReviewState | null): ChangeState[] {
	const keys = new Set(state?.guideResolution?.unassigned.units ?? [])
	if (!keys.size) return []
	return (state?.changes ?? []).filter(change =>
		keys.has(`${change.path}:${change.stableKey}`),
	)
}

export function unassignedFiles(state: ReviewState | null): string[] {
	return state?.guideResolution?.unassigned.files ?? []
}

// The span a reference lands on - the original side's lines, as the diff cursor addresses them.
export function referenceSpan(reference: GuideReference): CodeSpan {
	return {
		path: reference.path,
		side: reference.side,
		lineNumber: reference.lineNumber,
		endLine: reference.endLine,
	}
}

export function domainById(
	state: ReviewState | null,
	domainId: string,
): GuideDomain | undefined {
	return orderedDomains(state?.guide).find(domain => domain.id === domainId)
}
