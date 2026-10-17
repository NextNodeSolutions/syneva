// A replacement block's removed side, which a change does not record (it keeps only the side it is anchored on), and the trivia a block carries once both sides are known.
import { blockCounts, changeTitle } from '../domain/change-blocks.js'
import {
	changeBlocks,
	changeStableKeyFromBlock,
} from '../domain/diff/change.js'

import type { ChangeTrivia, LineSpan } from '../domain/outline.js'
import type { ChangeState, ReviewState } from '../domain/review.js'

// The old-side lines a replacement block removes: from where the cut put them when the block is a piece of git's (change-split.ts), else found again from its hunk - a change records only the side it is anchored on.
export function removedSpan(
	state: ReviewState,
	change: ChangeState,
): LineSpan | undefined {
	if (change.removedLine) {
		const { removed } = blockCounts(change)
		if (!removed) return undefined
		return {
			lineNumber: change.removedLine,
			endLine: change.removedLine + removed - 1,
		}
	}
	const file = state.files.find(entry => entry.path === change.path)
	const hunk = file?.hunks[change.hunkIndex]
	if (!hunk) return undefined
	const block = changeBlocks(hunk).find(
		lines => changeStableKeyFromBlock(lines) === change.stableKey,
	)
	const removed = block?.filter(line => line.kind === 'delete') ?? []
	const first = removed[0]?.oldLine
	const last = removed.at(-1)?.oldLine
	if (!first || !last) return undefined
	return { lineNumber: first, endLine: last }
}

export function needsRemovedSide(change: ChangeState): boolean {
	return (
		change.side === 'additions' &&
		!!change.trivia &&
		blockCounts(change).removed > 0
	)
}

export function withTrivia(
	change: ChangeState,
	trivia: ChangeTrivia | undefined,
): ChangeState {
	const { symbol } = change
	return {
		...change,
		trivia,
		title: changeTitle(blockCounts(change), { symbol, trivia }),
	}
}
