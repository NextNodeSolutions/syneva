import { orderedDomains } from './domains'
import { domainChanges } from './resolution'

import type { ChangeState, ReviewState } from '../model'
import type { CodeSpan, GuideDomain } from './model'

// A place in the review's code: a file, a side and a raw line on it - a change's start, or where the cursor sits.
export type CodePlace = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
}

export type FileOrder = Map<string, number>

export function fileOrderOf(state: ReviewState): FileOrder {
	return new Map(state.files.map((file, index) => [file.path, index]))
}

// The reading order of two places: file order, then the side (what was removed before what came), then the line.
function comparePlaces(a: CodePlace, b: CodePlace, order: FileOrder): number {
	const byFile = (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0)
	if (byFile !== 0) return byFile
	if (a.side !== b.side) return a.side === 'deletions' ? -1 : 1
	return a.lineNumber - b.lineNumber
}

// The changes a domain owns in reading order - what next/previous change steps through and what Start opens.
export function orderedDomainChanges(
	domain: GuideDomain,
	state: ReviewState,
): ChangeState[] {
	const order = fileOrderOf(state)
	return domainChanges(domain, state.changes).toSorted((a, b) =>
		comparePlaces(a, b, order),
	)
}

// One entry per file in first-seen order, its changes kept in the order given: a domain that touches one file ten times reads as one file with ten spans, not ten rows of the same path.
export type FileChanges = { path: string; changes: ChangeState[] }

export function changesByFile(changes: readonly ChangeState[]): FileChanges[] {
	const groups = new Map<string, ChangeState[]>()
	for (const change of changes) {
		const group = groups.get(change.path)
		if (group) group.push(change)
		else groups.set(change.path, [change])
	}
	return [...groups].map(([path, grouped]) => ({ path, changes: grouped }))
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
	// No domain chosen yet (the overview): next starts at the first, previous at the last.
	if (position < 0)
		return (direction === 1 ? domains[0] : domains.at(-1))?.id ?? null
	const next =
		domains[(position + direction + domains.length) % domains.length]
	return next?.id ?? null
}

// The owned change the cursor sits in, by file and raw line on its side.
export function changeAt(
	changes: readonly ChangeState[],
	at: CodePlace,
): ChangeState | undefined {
	return changes.find(
		change =>
			change.path === at.path &&
			change.side === at.side &&
			at.lineNumber >= change.lineNumber &&
			at.lineNumber <= (change.endLine ?? change.lineNumber),
	)
}

// The owned change after (or before) a place: from inside an owned block, the next block in reading order, wrapping around; from between two blocks or outside the domain's files, the first block past the place (or the last before it), so the step never leaps back to the domain's start. With no place (no cursor), the first or the last.
export function neighbourChange(
	ordered: readonly ChangeState[],
	at: CodePlace | undefined,
	direction: 1 | -1,
	order: FileOrder,
): ChangeState | undefined {
	if (!ordered.length) return undefined
	if (!at) return direction === 1 ? ordered[0] : ordered.at(-1)
	const current = changeAt(ordered, at)
	if (current) {
		const position = ordered.indexOf(current)
		return ordered[(position + direction + ordered.length) % ordered.length]
	}
	if (direction === 1)
		return (
			ordered.find(change => comparePlaces(change, at, order) > 0) ??
			ordered[0]
		)
	return (
		ordered.findLast(change => comparePlaces(change, at, order) < 0) ??
		ordered.at(-1)
	)
}
