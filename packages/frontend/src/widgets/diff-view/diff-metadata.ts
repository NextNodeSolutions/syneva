import {
	currentChanges,
	ensureChangesFromFileDiff,
	syncDisplayAnchors,
} from '@entities/review/changes'
import { cur } from '@entities/review/file/contents'
import { parseDiffFromFile } from '@pierre/diffs'

import { diffCtx } from './context'
import { decidedPositions, replayDecisions } from './replay-decisions'
import { D } from './runtime'

import type { ReviewState } from '@entities/review/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { DecidedPosition } from '@shared/diff-renderer/linemap'
import type { ReplayOutcome } from './replay-decisions'
import type { DiffView } from './types'

type ReviewFile = ReviewState['files'][number]

// Pierre keeps an instance's highlighted render while the diff it is handed is the same target
// (areDiffTargetsEqual: identity without a cacheKey), so a pass whose inputs did not change must
// hand back the SAME metadata - a fresh object re-tokenizes the whole file. Both steps memoize on
// their inputs: the parse on the two named file versions, the replay on the parse and the
// decided list.
type ParsedDiff = {
	oldName: string
	newName: string
	oldContents: string
	newContents: string
	diff: FileDiffMetadata
}
let lastParsed: ParsedDiff | null = null

type ReplayedDiff = {
	raw: FileDiffMetadata
	decidedKey: string
	outcome: ReplayOutcome
}
let lastReplayed: ReplayedDiff | null = null

function parsedDiff(
	oldFile: { name: string; contents: string },
	newFile: { name: string; contents: string },
): FileDiffMetadata {
	const parsed = lastParsed
	if (
		parsed?.oldName === oldFile.name &&
		parsed.newName === newFile.name &&
		parsed.oldContents === oldFile.contents &&
		parsed.newContents === newFile.contents
	)
		return parsed.diff
	const diff = parseDiffFromFile(oldFile, newFile)
	lastParsed = {
		oldName: oldFile.name,
		newName: newFile.name,
		oldContents: oldFile.contents,
		newContents: newFile.contents,
		diff,
	}
	return diff
}

function replayedDiff(
	raw: FileDiffMetadata,
	decided: DecidedPosition[],
): ReplayOutcome {
	const decidedKey = JSON.stringify(decided)
	const replayed = lastReplayed
	if (replayed?.raw === raw && replayed.decidedKey === decidedKey)
		return replayed.outcome
	const outcome = replayDecisions(raw, decided)
	lastReplayed = { raw, decidedKey, outcome }
	return outcome
}

export function buildDiffMetadata(
	file: ReviewFile,
	view: DiffView,
): FileDiffMetadata {
	const isViewOnly =
		view.isPreviewing ||
		(diffCtx().S.state?.mode === 'file' &&
			(cur.oldContents === '' || cur.oldContents === cur.newContents))
	const raw = parsedDiff(
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
	const { diff, lineMap } = replayedDiff(raw, decidedPositions(raw))
	D.lineMap = lineMap
	syncDisplayAnchors(diff, currentChanges(state, file))
	return diff
}
