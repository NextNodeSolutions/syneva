import { diffAcceptRejectHunk } from '@pierre/diffs'
import { distillAccepted } from '@shared/diff-renderer/distill'
import { buildLineMap } from '@shared/diff-renderer/linemap'
import { planReplayCalls } from '@shared/diff-renderer/replay-plan'

import { diffCtx } from './context'

import type { ChangeParts } from '@entities/review/change/change-parts'
import type { ChangeState } from '@entities/review/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { DecidedPosition, LineMap } from '@shared/diff-renderer/linemap'

// Resolutions renumber lines but preserve hunk count and per-hunk content-entry count 1:1 (a resolved change becomes a context entry at the same index).
// So a part's (hunkIndex, changeIndex) addresses it in the raw AND replayed diff alike.

function decidedStatus(change: ChangeState): DecidedPosition['status'] {
	if (change.status === 'rejected') return 'rejected'
	return diffCtx().S.settings.hideReviewed ? 'cut' : 'accepted'
}

function byPosition(a: DecidedPosition, b: DecidedPosition): number {
	return a.hunkIndex - b.hunkIndex || a.changeIndex - b.changeIndex
}

// A decided change resolves every part Pierre drew of it, in diff order so one hunk's parts group into one call.
export function decidedPositions(
	changes: readonly ChangeState[],
	parts: ChangeParts,
): DecidedPosition[] {
	return changes
		.filter(change => change.status !== 'pending')
		.flatMap(change =>
			(parts.get(change.id) ?? []).map(({ hunkIndex, changeIndex }) => ({
				hunkIndex,
				changeIndex,
				status: decidedStatus(change),
			})),
		)
		.toSorted(byPosition)
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
