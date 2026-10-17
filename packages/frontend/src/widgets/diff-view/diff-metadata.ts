import { mapChangeParts } from '@entities/review/change/change-parts'
import { currentChanges, syncDisplayAnchors } from '@entities/review/changes'
import { cur } from '@entities/review/file/contents'
import { parseDiffFromFile } from '@pierre/diffs'
import { trimDiff } from '@shared/diff-renderer/trim'
import { entryKey } from '@shared/diff-renderer/trim-rows'
import { fingerprint } from '@shared/lib/fingerprint'

import { focusCut } from './brick-focus'
import { diffCtx } from './context'
import { decidedPositions, replayDecisions } from './replay-decisions'
import { D } from './runtime'

import type { ChangeParts } from '@entities/review/change/change-parts'
import type { ChangeState, ReviewState } from '@entities/review/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { DecidedPosition } from '@shared/diff-renderer/linemap'
import type { TrimmedDiff } from '@shared/diff-renderer/trim'
import type { CutSource } from './brick-window'
import type { ReplayOutcome } from './replay-decisions'
import type { DiffView } from './types'

type ReviewFile = ReviewState['files'][number]

// Pierre keeps an instance's highlighted render while the diff it is handed is the same target, so a pass whose inputs did not change must hand back the SAME metadata - a fresh object re-tokenizes the whole file.
// Every step memoizes on its inputs (parse on the two file versions, the parts map on parse + the file's change ids, replay on parse + decided list); each metadata carries a cacheKey, which the worker pool caches highlighted results under across instances, so a revisited file colors from the cache.
// The parse only draws: the file's changes are the hub's (ids, spans, order), never re-cut from it - each is mapped onto the parts Pierre drew (change-parts.ts).
type ParsedDiff = {
	oldName: string
	newName: string
	oldContents: string
	newContents: string
	diff: FileDiffMetadata
}
let lastParsed: ParsedDiff | null = null

type MappedParts = {
	raw: FileDiffMetadata
	changesKey: string
	parts: ChangeParts
}
let lastMapped: MappedParts | null = null

type ReplayedDiff = {
	raw: FileDiffMetadata
	decidedKey: string
	outcome: ReplayOutcome
}
let lastReplayed: ReplayedDiff | null = null

// The brick view's cut (brick-focus.ts) memoizes on the replay it cuts and the rows it keeps, and the parts it moves on the cut and the parts they were: a brick read again is the same target, and Pierre keeps its render.
type CutDiff = {
	replayed: FileDiffMetadata
	windowKey: string
	trimmed: TrimmedDiff | null
}
let lastCut: CutDiff | null = null

type CutParts = {
	trimmed: TrimmedDiff
	parts: ChangeParts
	moved: ChangeParts
}
let lastCutParts: CutParts | null = null

type FileVersion = { name: string; contents: string }
type FileContents = { oldContents: string; newContents: string }

function keyedFile(file: FileVersion): FileVersion & { cacheKey: string } {
	return { ...file, cacheKey: `${file.name}@${fingerprint(file.contents)}` }
}

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

// A change id spells its path and span (path:side:line:removed:added), so the ids name everything the map reads off the changes.
function changeParts(
	raw: FileDiffMetadata,
	changes: readonly ChangeState[],
): ChangeParts {
	const changesKey = changes.map(change => change.id).join('\n')
	const mapped = lastMapped
	if (mapped?.raw === raw && mapped.changesKey === changesKey)
		return mapped.parts
	const parts = mapChangeParts(raw, changes)
	lastMapped = { raw, changesKey, parts }
	return parts
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

function cutDiff(
	replayed: FileDiffMetadata,
	window: Parameters<typeof trimDiff>[1],
	windowKey: string,
): TrimmedDiff | null {
	const cut = lastCut
	if (cut?.replayed === replayed && cut.windowKey === windowKey)
		return cut.trimmed
	const trimmed = trimDiff(replayed, window, windowKey)
	lastCut = { replayed, windowKey, trimmed }
	return trimmed
}

// The parts each change owns, moved to where the cut put them: the cut keeps every entry a part names (or the pieces a break split it into), so the parts are the ones mapped on the whole file, never re-cut from the brick's few rows.
function cutParts(trimmed: TrimmedDiff, parts: ChangeParts): ChangeParts {
	const cut = lastCutParts
	if (cut?.trimmed === trimmed && cut.parts === parts) return cut.moved
	const moved = new Map(
		[...parts].map(([id, positions]) => [
			id,
			positions.flatMap(
				at =>
					trimmed.positions.get(
						entryKey(at.hunkIndex, at.changeIndex),
					) ?? [],
			),
		]),
	)
	lastCutParts = { trimmed, parts, moved }
	return moved
}

type Drawn = { diff: FileDiffMetadata; parts: ChangeParts }

// The brick view draws the replay cut to the brick (and the parts moved with it); every other pass draws the replay whole.
function focusedDiff(
	file: ReviewFile,
	changes: readonly ChangeState[],
	whole: CutSource,
): Drawn {
	const focus = focusCut(file, changes, whole)
	const trimmed = focus && cutDiff(whole.diff, focus.window, focus.windowKey)
	D.focus = trimmed ? focus.focus : null
	if (!trimmed) return whole
	const parts = cutParts(trimmed, whole.parts)
	syncDisplayAnchors(trimmed.diff, changes, parts, whole.lineMap)
	return { diff: trimmed.diff, parts }
}

export function buildDiffMetadata(
	file: ReviewFile,
	view: DiffView,
): FileDiffMetadata {
	const isViewOnly = isViewOnlyDiff(cur, view.isPreviewing)
	const raw = parsedDiff(...fileVersions(file, cur, isViewOnly))
	if (isViewOnly) {
		D.lineMap = null
		D.parts = null
		D.focus = null
		return raw
	}
	const { state } = diffCtx().S
	if (!state) throw new Error('review state read before the first fetch')
	const changes = currentChanges(state, file)
	const parts = changeParts(raw, changes)
	const decided = decidedPositions(changes, parts)
	const { diff, lineMap } = replayedDiff(raw, decided)
	syncDisplayAnchors(diff, changes, parts, lineMap)
	const drawn = focusedDiff(file, changes, {
		raw,
		diff,
		parts,
		lineMap,
		decided,
	})
	D.lineMap = lineMap
	D.parts = drawn.parts
	return drawn.diff
}
