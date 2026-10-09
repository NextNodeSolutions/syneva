import { orderedDomains } from './domains'
import { domainChanges } from './resolution'

import type { ChangeState, ReviewState } from '../model'
import type { CodeSpan, GuideDomain } from './model'

// The changes a domain owns in reading order: file order, then the block's position on its side - what next/previous change steps through and what Start opens.
export function orderedDomainChanges(
	domain: GuideDomain,
	state: ReviewState,
): ChangeState[] {
	const fileOrder = new Map(
		state.files.map((file, index) => [file.path, index]),
	)
	return domainChanges(domain, state.changes).toSorted((a, b) => {
		const byFile =
			(fileOrder.get(a.path) ?? 0) - (fileOrder.get(b.path) ?? 0)
		if (byFile !== 0) return byFile
		if (a.side !== b.side) return a.side === 'deletions' ? -1 : 1
		return a.lineNumber - b.lineNumber
	})
}

export function changeSpan(change: ChangeState): CodeSpan {
	return {
		path: change.path,
		side: change.side,
		lineNumber: change.lineNumber,
		endLine: change.endLine,
	}
}

// Where a domain starts: its first owned change, else (a file-only domain) its first member's file.
export function domainEntry(
	domain: GuideDomain,
	state: ReviewState,
): { span: CodeSpan } | { path: string } | null {
	const [first] = orderedDomainChanges(domain, state)
	if (first) return { span: changeSpan(first) }
	const [member] = domain.members
	if (!member) return null
	return { path: member.path }
}

export function neighbourDomainId(
	state: ReviewState | null,
	currentId: string | null,
	direction: 1 | -1,
): string | null {
	const domains = orderedDomains(state?.guide)
	if (!domains.length) return null
	const position = domains.findIndex(domain => domain.id === currentId)
	const next =
		domains[(position + direction + domains.length) % domains.length]
	return next?.id ?? null
}

// The owned change the cursor sits in, by file and raw line on its side.
export function changeAt(
	changes: readonly ChangeState[],
	at: { path: string; side: 'additions' | 'deletions'; lineNumber: number },
): ChangeState | undefined {
	return changes.find(
		change =>
			change.path === at.path &&
			change.side === at.side &&
			at.lineNumber >= change.lineNumber &&
			at.lineNumber <= (change.endLine ?? change.lineNumber),
	)
}

export function neighbourChange(
	ordered: readonly ChangeState[],
	current: ChangeState | undefined,
	direction: 1 | -1,
): ChangeState | undefined {
	if (!ordered.length) return undefined
	const position = current ? ordered.indexOf(current) : -1
	if (position < 0) return direction === 1 ? ordered[0] : ordered.at(-1)
	return ordered[(position + direction + ordered.length) % ordered.length]
}
