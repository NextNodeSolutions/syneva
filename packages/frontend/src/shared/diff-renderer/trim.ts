import { isContextRow, keptRows, splitRuns, walkRows } from './trim-rows'

import type { FileDiffMetadata } from '@pierre/diffs'
import type { Row, RowWindow } from './trim-rows'

// Cuts a full diff down to the rows of a window - one brick's lines on each side - so Pierre draws those rows and nothing else: the rows outside are not hidden, they are not in the diff.
// The cut is a PARTIAL diff: its line arrays hold the kept rows only, each hunk's own indices address them and its starts carry the file's line numbers, so the gutter reads the real lines; a partial diff has no unchanged context to open, so no separator offers any.
// Every entry keeps the source's ABSOLUTE 0-based indices (Pierre's walk reads a hunk's indices, never an entry's): what reads an entry's rows - the parts' spans, the display anchors, the cursor's blocks - reads the same lines it reads on the whole file.

type Hunk = FileDiffMetadata['hunks'][number]
type Entry = Hunk['hunkContent'][number]

export type EntryPosition = { hunkIndex: number; changeIndex: number }
// Where each entry of the source landed in the cut, by `hunkIndex:changeIndex` (trim-rows' entryKey): an entry with no row kept lands nowhere, one a break cuts in two lands twice.
export type TrimmedDiff = {
	diff: FileDiffMetadata
	positions: ReadonlyMap<string, readonly EntryPosition[]>
}

type Group = { rows: Row[]; source: string | null }
// Where a hunk starts in the cut: its first rows in the kept arrays, and in Pierre's split and stacked row counts.
type Offsets = {
	deletionIndex: number
	additionIndex: number
	split: number
	unified: number
}

// One entry per source entry and kind: a resolved part (now context) next to plain context stays its own entry, as the replay leaves it, so its rows stay its own.
function groupRows(run: readonly Row[]): Group[] {
	const groups: Group[] = []
	for (const row of run) {
		const group = groups.at(-1)
		const first = group?.rows[0]
		if (
			group &&
			first &&
			first.source === row.source &&
			isContextRow(first) === isContextRow(row)
		)
			group.rows.push(row)
		else groups.push({ rows: [row], source: row.source })
	}
	return groups
}

// A part with no row kept on a side sits where that side stands, as Pierre's parse places an insertion or a removal.
function entryOf(rows: readonly Row[]): Entry {
	const [first] = rows
	if (!first) throw new Error('trim: an empty entry')
	if (isContextRow(first))
		return {
			type: 'context',
			lines: rows.length,
			deletionLineIndex: first.deletion,
			additionLineIndex: first.addition,
		}
	const deletions = rows.filter(row => row.hasDeletion)
	const additions = rows.filter(row => row.hasAddition)
	return {
		type: 'change',
		deletions: deletions.length,
		deletionLineIndex: deletions[0]?.deletion ?? first.deletion,
		additions: additions.length,
		additionLineIndex: additions[0]?.addition ?? first.addition,
	}
}

function rowCounts(entries: readonly Entry[]): {
	split: number
	unified: number
} {
	let split = 0
	let unified = 0
	for (const entry of entries) {
		split +=
			entry.type === 'context'
				? entry.lines
				: Math.max(entry.deletions, entry.additions)
		unified +=
			entry.type === 'context'
				? entry.lines
				: entry.deletions + entry.additions
	}
	return { split, unified }
}

type HunkInput = {
	run: readonly Row[]
	entries: Entry[]
	gap: number
	at: Offsets
	source: FileDiffMetadata
}

// A side's first line, 1-based; a side the hunk holds no line of starts at the line before where it sits (Pierre's `-N,0`).
function startLine(
	held: Row | undefined,
	first: Row,
	index: (row: Row) => number,
): number {
	return held ? index(held) + 1 : index(first)
}

function hunkOf({ run, entries, gap, at, source }: HunkInput): Hunk {
	const [first] = run
	if (!first) throw new Error('trim: an empty hunk')
	const deletions = run.filter(row => row.hasDeletion)
	const additions = run.filter(row => row.hasAddition)
	const counts = rowCounts(entries)
	const lastHunk = source.hunks.at(-1)
	return {
		collapsedBefore: gap,
		deletionStart: startLine(deletions[0], first, row => row.deletion),
		deletionCount: deletions.length,
		deletionLines: deletions.filter(row => !row.hasAddition).length,
		deletionLineIndex: at.deletionIndex,
		additionStart: startLine(additions[0], first, row => row.addition),
		additionCount: additions.length,
		additionLines: additions.filter(row => !row.hasDeletion).length,
		additionLineIndex: at.additionIndex,
		hunkContent: entries,
		splitLineStart: at.split + gap,
		splitLineCount: counts.split,
		unifiedLineStart: at.unified + gap,
		unifiedLineCount: counts.unified,
		noEOFCRDeletions:
			!!lastHunk?.noEOFCRDeletions &&
			deletions.at(-1)?.deletion === source.deletionLines.length - 1,
		noEOFCRAdditions:
			!!lastHunk?.noEOFCRAdditions &&
			additions.at(-1)?.addition === source.additionLines.length - 1,
	}
}

function lineAt(lines: readonly string[], index: number): string {
	const line = lines[index]
	if (line === undefined) throw new Error(`trim: missing row ${index}`)
	return line
}

// The rows between two runs, on the added side (Pierre's measure of a collapsed run); at least one, so the break is drawn.
function gapBefore(
	run: readonly Row[],
	previous: readonly Row[] | undefined,
): number {
	const [first] = run
	const last = previous?.at(-1)
	if (!first || !last) return 0
	return Math.max(first.addition - last.addition - 1, 1)
}

function recordPositions(
	positions: Map<string, EntryPosition[]>,
	groups: readonly Group[],
	hunkIndex: number,
): void {
	groups.forEach((group, changeIndex) => {
		if (group.source === null) return
		const landed = positions.get(group.source) ?? []
		landed.push({ hunkIndex, changeIndex })
		positions.set(group.source, landed)
	})
}

function pushLines(
	lines: { deletions: string[]; additions: string[] },
	run: readonly Row[],
	source: FileDiffMetadata,
): void {
	for (const row of run) {
		if (row.hasDeletion)
			lines.deletions.push(lineAt(source.deletionLines, row.deletion))
		if (row.hasAddition)
			lines.additions.push(lineAt(source.additionLines, row.addition))
	}
}

function advance(at: Offsets, hunk: Hunk): Offsets {
	return {
		deletionIndex: at.deletionIndex + hunk.deletionCount,
		additionIndex: at.additionIndex + hunk.additionCount,
		split: at.split + hunk.collapsedBefore + hunk.splitLineCount,
		unified: at.unified + hunk.collapsedBefore + hunk.unifiedLineCount,
	}
}

// Pierre compares two diffs by their cache keys, and its worker pool caches a highlighted cut under its own: the window joins the source's key, so a brick read again colors from the cache and never answers for the whole file.
function cutCacheKey(
	source: FileDiffMetadata,
	windowKey: string,
): { cacheKey: string } | undefined {
	if (!source.cacheKey) return undefined
	return { cacheKey: `${source.cacheKey}:brick:${windowKey}` }
}

// The cut of a full diff to a window's rows; null when the window holds none of them.
export function trimDiff(
	source: FileDiffMetadata,
	window: RowWindow,
	windowKey: string,
): TrimmedDiff | null {
	const runs = splitRuns(keptRows(walkRows(source), window))
	if (!runs.length) return null
	const positions = new Map<string, EntryPosition[]>()
	const lines: { deletions: string[]; additions: string[] } = {
		deletions: [],
		additions: [],
	}
	let at: Offsets = {
		deletionIndex: 0,
		additionIndex: 0,
		split: 0,
		unified: 0,
	}
	const hunks = runs.map((run, hunkIndex) => {
		const groups = groupRows(run)
		recordPositions(positions, groups, hunkIndex)
		const hunk = hunkOf({
			run,
			entries: groups.map(group => entryOf(group.rows)),
			gap: gapBefore(run, runs[hunkIndex - 1]),
			at,
			source,
		})
		pushLines(lines, run, source)
		at = advance(at, hunk)
		return hunk
	})
	return {
		diff: {
			...source,
			...cutCacheKey(source, windowKey),
			hunks,
			isPartial: true,
			deletionLines: lines.deletions,
			additionLines: lines.additions,
			splitLineCount: at.split,
			unifiedLineCount: at.unified,
		},
		positions,
	}
}
