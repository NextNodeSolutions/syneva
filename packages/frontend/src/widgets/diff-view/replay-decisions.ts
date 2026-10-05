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

// Resolutions renumber lines but preserve hunk count and per-hunk content-entry count
// 1:1 (a resolved change becomes a context entry at the same index), so the recorded
// (hunkIndex, changeIndex) addresses the block in raw AND replayed diffs alike.
function changePosition(
	diff: FileDiffMetadata,
	change: ChangeState,
): ChangePosition | null {
	// The address is only valid where it was recorded; a record without one (or pointing at a
	// part the diff no longer has) says nothing about this diff - not found.
	const { hunkIndex, changeIndex } = change
	if (typeof changeIndex !== 'number') return null
	const part = diff.hunks[hunkIndex]?.hunkContent[changeIndex]
	if (part?.type !== 'change') return null
	return { hunkIndex, changeIndex }
}

// Every decided block, with its display treatment: accepted shows the band (its additions
// merged into context), rejected keeps the deletions, and - with the hide-reviewed pref on -
// a CUT accepted block is distilled out of the rendered diff entirely (see distill.ts). The
// pref is read here so the replay's line map and the metadata builder derive from ONE
// decided list computed in ONE pass.
export function decidedPositions(diff: FileDiffMetadata): DecidedPosition[] {
	const decided: DecidedPosition[] = []
	// Resolve every position against the RAW diff up front (the fallback lookup would
	// mis-match against a partially resolved one), then apply by invariant indexes.
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
	// The raw↔display line map the rest of the render (annotations, cursor, selections)
	// converts through; null = identity (nothing decided).
	lineMap: LineMap | null
}

// Replay every decided block onto the raw diff and rebuild its line map. Cut blocks replay
// like any accepted block (they become the context entries the distiller then drops), but
// their line-map breaks compress the display streams.
export function replayDecisions(
	diff: FileDiffMetadata,
	decided: DecidedPosition[],
): ReplayOutcome {
	let resolved = diff
	for (const call of planReplayCalls(diff, decided)) {
		// Cut entries replay too: their context entries are what the distiller drops.
		try {
			resolved = diffAcceptRejectHunk(
				resolved,
				call.hunkIndex,
				call.options,
			)
		} catch {
			// leave this block unresolved rather than aborting the replay
		}
	}
	return {
		diff: decided.some(decision => decision.status === 'cut')
			? distillAccepted(resolved, decided)
			: resolved,
		lineMap: decided.length ? buildLineMap(diff, decided) : null,
	}
}
