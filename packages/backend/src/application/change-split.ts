// Every block of the review cut at the declarations it crosses (domain/diff/block-split.ts) once both sides' outlines are read: the git block is found again in its hunk by its key, and each piece becomes a change of its own, its key, hash and title derived as for any block - so the desk's change set has one change per brick's edit, and a verdict on one function never carries the next one.
import { splitBlock } from '../domain/diff/block-split.js'
import {
	changeBlocks,
	changeStableKeyFromBlock,
} from '../domain/diff/change.js'

import { changeForBlock } from './diff-files.js'
import { outlineFor } from './side-outlines.js'

import type { ChangeState, ReviewState } from '../domain/review.js'
import type { GitPort } from './ports.js'
import type { SideTexts } from './side-outlines.js'

function splitChange(
	state: ReviewState,
	change: ChangeState,
	texts: SideTexts,
	git: GitPort,
): ChangeState[] {
	const file = state.files.find(entry => entry.path === change.path)
	const hunk = file?.hunks[change.hunkIndex]
	const block = hunk
		? changeBlocks(hunk).find(
				lines => changeStableKeyFromBlock(lines) === change.stableKey,
			)
		: undefined
	if (!hunk || !block) return [change]
	const pieces = splitBlock(block, {
		additions: outlineFor('additions', change.path, texts, git),
		deletions: outlineFor('deletions', change.path, texts, git),
	})
	if (!pieces[1]) return [change]
	return pieces.map(piece =>
		changeForBlock({
			filePath: change.path,
			hunk,
			hunkIndex: change.hunkIndex,
			block: piece,
			isStageable: change.stageable === true,
		}),
	)
}

export function splitChanges(
	state: ReviewState,
	texts: SideTexts,
	git: GitPort,
): ChangeState[] {
	return state.changes.flatMap(change =>
		splitChange(state, change, texts, git),
	)
}
