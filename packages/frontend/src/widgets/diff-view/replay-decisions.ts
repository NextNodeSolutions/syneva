import { currentChanges, currentFileOrNull } from '@entities/review/changes'
import { diffAcceptRejectHunk } from '@pierre/diffs'
import { distillAccepted } from '@shared/diff-renderer/distill'
import { buildLineMap } from '@shared/diff-renderer/linemap'
import { planReplayCalls } from '@shared/diff-renderer/replay-plan'

import { diffCtx } from './context'

import type { ChangeState } from '@entities/review/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { DecidedPosition, LineMap } from '@shared/diff-renderer/linemap'

export type ChangePosition = { hunkIndex: number; changeIndex: number }

// Resolutions renumber lines but preserve hunk count and per-hunk content-entry count 1:1 (a resolved change becomes a context entry at the same index).
// So the recorded (hunkIndex, changeIndex) addresses the block in the raw AND replayed diff alike.
function changePosition(
	diff: FileDiffMetadata,
	change: ChangeState,
): ChangePosition | null {
	const { hunkIndex, changeIndex } = change
	if (typeof changeIndex !== 'number') return null
	const part = diff.hunks[hunkIndex]?.hunkContent[changeIndex]
	if (part?.type !== 'change') return null
	return { hunkIndex, changeIndex }
}

export function decidedPositions(diff: FileDiffMetadata): DecidedPosition[] {
	const decided: DecidedPosition[] = []
	for (const change of currentChanges(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	).filter(c => c.status !== 'pending')) {
		const pos = changePosition(diff, change)
		if (!pos) continue
		let status: DecidedPosition['status'] = 'accepted'
		if (change.status === 'rejected') status = 'rejected'
		else if (diffCtx().S.settings.hideReviewed) status = 'cut'
		decided.push({ ...pos, status })
	}
	return decided
}

export type ReplayOutcome = {
	diff: FileDiffMetadata
	lineMap: LineMap | null
}

export function replayDecisions(
	diff: FileDiffMetadata,
	decided: DecidedPosition[],
): ReplayOutcome {
	let resolved = diff
	for (const call of planReplayCalls(diff, decided)) {
		try {
			resolved = diffAcceptRejectHunk(
				resolved,
				call.hunkIndex,
				call.options,
			)
		} catch {
			/* a decision whose block is gone after a reload leaves that part unresolved instead of aborting the replay */
		}
	}
	return {
		diff: decided.some(decision => decision.status === 'cut')
			? distillAccepted(resolved, decided)
			: resolved,
		lineMap: decided.length ? buildLineMap(diff, decided) : null,
	}
}
