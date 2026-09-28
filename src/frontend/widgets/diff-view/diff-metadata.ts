import {
	currentChanges,
	currentFileOrNull,
	ensureChangesFromFileDiff,
	syncDisplayAnchors,
} from '@entities/review/changes'
import { cur } from '@entities/review/file/contents'
import { parseDiffFromFile } from '@pierre/diffs'
import { distillAccepted } from '@shared/diff-renderer/distill'

import { diffCtx } from './context'
import { replayDecisions } from './replay-decisions'
import { D } from './runtime'

import type { ReviewState } from '@entities/review/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { DiffView } from './diff-key'

type ReviewFile = ReviewState['files'][number]

export function buildDiffMetadata(
	file: ReviewFile,
	view: DiffView,
): FileDiffMetadata {
	const isViewOnly =
		view.isPreviewing ||
		(diffCtx().S.state?.mode === 'file' &&
			(cur.oldContents === '' || cur.oldContents === cur.newContents))
	const raw = parseDiffFromFile(
		{
			name: file.oldPath ?? file.path,
			contents: isViewOnly ? '' : cur.oldContents,
		},
		{ name: file.newPath ?? file.path, contents: cur.newContents },
	)
	if (isViewOnly) {
		D.lineMap = null
		return raw
	}
	const { state } = diffCtx().S
	if (!state) throw new Error('review state read before the first fetch')
	ensureChangesFromFileDiff(raw, state, file)
	const { diff: replayed, decided } = replayDecisions(raw)
	const final = decided.some(decision => decision.status === 'cut')
		? distillAccepted(replayed, decided)
		: replayed
	syncDisplayAnchors(
		final,
		currentChanges(
			state,
			currentFileOrNull(
				state.files,
				diffCtx().S.preview,
				diffCtx().S.fileIndex,
			),
		),
	)
	return final
}
