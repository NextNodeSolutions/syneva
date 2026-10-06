import type { ChangeContent, FileDiffMetadata } from '@pierre/diffs'
import type { Side } from '@shared/diff-renderer/types'
import type { ChangeState, Decision } from '../model'

// Identity is the stableKey, so a block keeps its record - and its decision - across re-derivations of the same content.

export function changeStableKey(part: ChangeContent): string {
	const side = part.additions > 0 ? 'additions' : 'deletions'
	const lineNumber =
		(side === 'additions'
			? part.additionLineIndex
			: part.deletionLineIndex) + 1
	return `${side}:${lineNumber}:${part.deletions || 0}:${part.additions || 0}`
}

function changeSpan(part: ChangeContent): {
	side: Side
	lineNumber: number
	endLine: number
} {
	if (part.additions > 0)
		return {
			side: 'additions',
			lineNumber: part.additionLineIndex + 1,
			endLine: part.additionLineIndex + (part.additions || 1),
		}
	return {
		side: 'deletions',
		lineNumber: part.deletionLineIndex + 1,
		endLine: part.deletionLineIndex + (part.deletions || 1),
	}
}

function deriveChange(
	block: { part: ChangeContent; hunkIndex: number; contentIndex: number },
	context: {
		path: string
		decisions: Decision[]
		previous: Map<string, ChangeState>
	},
): ChangeState {
	const { path, decisions, previous } = context
	const { part, hunkIndex, contentIndex } = block
	const stableKey = changeStableKey(part)
	const id = `${path}:${stableKey}`
	const prev = previous.get(id)
	// Status comes from the explicit decision record (the source of truth), not from whether the hunk happens to be staged.
	const decision = decisions.find(d => d.key === id)
	const status: ChangeState['status'] = decision?.status ?? 'pending'
	return {
		id,
		path,
		hunkIndex,
		changeIndex: contentIndex,
		stableKey,
		...changeSpan(part),
		title: `${part.deletions} removed · ${part.additions} added`,
		status,
		stageable: prev?.stageable,
		contentHash: prev?.contentHash,
		reviewedHash: decision?.reviewedHash ?? prev?.reviewedHash,
	}
}

export function deriveChanges(
	diff: FileDiffMetadata,
	path: string,
	decisions: Decision[] = [],
	previous = new Map<string, ChangeState>(),
): ChangeState[] {
	const context = { path, decisions, previous }
	const derived: ChangeState[] = []
	for (const [hunkIndex, hunk] of diff.hunks.entries())
		derived.push(...deriveHunkChanges(hunk, hunkIndex, context))
	return derived
}

function deriveHunkChanges(
	hunk: FileDiffMetadata['hunks'][number],
	hunkIndex: number,
	context: {
		path: string
		decisions: Decision[]
		previous: Map<string, ChangeState>
	},
): ChangeState[] {
	const derived: ChangeState[] = []
	for (const [contentIndex, part] of hunk.hunkContent.entries()) {
		if (part.type === 'change')
			derived.push(
				deriveChange({ part, hunkIndex, contentIndex }, context),
			)
	}
	return derived
}
