import {
	currentChanges,
	ensureChangesFromFileDiff,
	syncDisplayAnchors,
} from '@entities/review/changes'
import { cur } from '@entities/review/file/contents'
import { parseDiffFromFile } from '@pierre/diffs'
import { fingerprint } from '@shared/lib/fingerprint'

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
// (areDiffTargetsEqual), so a pass whose inputs did not change must hand back the SAME metadata -
// a fresh object re-tokenizes the whole file. Both steps memoize on their inputs: the parse on the
// two named file versions, the replay on the parse and the decided list. Each file version also
// carries a content cacheKey: Pierre derives the diff's key from both (and a new one per
// accept/reject resolution), which is what its worker pool caches highlighted results under -
// across instances, so a revisited file colors from the cache.
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

type FileVersion = { name: string; contents: string }
type FileContents = { oldContents: string; newContents: string }

function keyedFile(file: FileVersion): FileVersion & { cacheKey: string } {
	return { ...file, cacheKey: `${file.name}@${fingerprint(file.contents)}` }
}

// A view-only file (a preview, or a file-mode review of a new or unchanged file) renders
// one-sided: its old side is empty.
function isViewOnlyDiff(
	contents: FileContents,
	isPreviewing: boolean,
): boolean {
	if (isPreviewing) return true
	if (diffCtx().S.state?.mode !== 'file') return false
	return (
		contents.oldContents === '' ||
		contents.oldContents === contents.newContents
	)
}

function fileVersions(
	file: ReviewFile,
	contents: FileContents,
	isViewOnly: boolean,
): [FileVersion, FileVersion] {
	return [
		{
			name: file.oldPath ?? file.path,
			contents: isViewOnly ? '' : contents.oldContents,
		},
		{ name: file.newPath ?? file.path, contents: contents.newContents },
	]
}

// A file's keyed raw diff, built fresh: for priming a file other than the one on screen (the
// memoized parse below belongs to the visible file).
export function rawFileDiff(
	file: ReviewFile,
	contents: FileContents,
): FileDiffMetadata {
	const [oldFile, newFile] = fileVersions(
		file,
		contents,
		isViewOnlyDiff(contents, false),
	)
	return parseDiffFromFile(keyedFile(oldFile), keyedFile(newFile))
}

function parsedDiff(
	oldFile: FileVersion,
	newFile: FileVersion,
): FileDiffMetadata {
	const parsed = lastParsed
	if (
		parsed?.oldName === oldFile.name &&
		parsed.newName === newFile.name &&
		parsed.oldContents === oldFile.contents &&
		parsed.newContents === newFile.contents
	)
		return parsed.diff
	const diff = parseDiffFromFile(keyedFile(oldFile), keyedFile(newFile))
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
	const isViewOnly = isViewOnlyDiff(cur, view.isPreviewing)
	const raw = parsedDiff(...fileVersions(file, cur, isViewOnly))
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
