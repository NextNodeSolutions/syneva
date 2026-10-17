import type { ChangeContent, FileDiffMetadata } from '@pierre/diffs'

// The rows a trim keeps (trim.ts): the file walked row by row as Pierre draws it with every collapsed run open, the rows a window holds, and the runs they fall into.

type Hunk = FileDiffMetadata['hunks'][number]

// A side's lines to keep, 1-based and inclusive, in the diff's own numbering.
export type LineSpan = { start: number; end: number }
export type RowWindow = {
	deletions: readonly LineSpan[]
	additions: readonly LineSpan[]
}

// One row: its 0-based index on each side - for a side the row does not hold, where that side stands - and the entry it came from (none for collapsed context, which no entry draws).
export type Row = {
	deletion: number
	addition: number
	hasDeletion: boolean
	hasAddition: boolean
	source: string | null
}
type Cursor = { deletion: number; addition: number }

export function entryKey(hunkIndex: number, changeIndex: number): string {
	return `${hunkIndex}:${changeIndex}`
}

export function isContextRow(row: Row): boolean {
	return row.hasDeletion && row.hasAddition
}

function pushContext(
	rows: Row[],
	from: Cursor,
	lines: number,
	source: string | null,
): void {
	for (let i = 0; i < lines; i++)
		rows.push({
			deletion: from.deletion + i,
			addition: from.addition + i,
			hasDeletion: true,
			hasAddition: true,
			source,
		})
}

// Pierre's unified order: a part's removed rows, then its added ones.
function pushChange(
	rows: Row[],
	at: Cursor,
	entry: ChangeContent,
	source: string,
): void {
	for (let i = 0; i < entry.deletions; i++)
		rows.push({
			deletion: at.deletion + i,
			addition: at.addition,
			hasDeletion: true,
			hasAddition: false,
			source,
		})
	for (let i = 0; i < entry.additions; i++)
		rows.push({
			deletion: at.deletion + entry.deletions,
			addition: at.addition + i,
			hasDeletion: false,
			hasAddition: true,
			source,
		})
}

// A side with no line in the hunk starts where the hunk sits, as Pierre's walk reads it.
function sideStart(start: number, count: number, lineIndex: number): number {
	return count === 0 ? start : lineIndex
}

function pushHunk(rows: Row[], hunk: Hunk, hunkIndex: number): Cursor {
	const at = {
		deletion: sideStart(
			hunk.deletionStart,
			hunk.deletionCount,
			hunk.deletionLineIndex,
		),
		addition: sideStart(
			hunk.additionStart,
			hunk.additionCount,
			hunk.additionLineIndex,
		),
	}
	const gap = hunk.collapsedBefore
	pushContext(
		rows,
		{ deletion: at.deletion - gap, addition: at.addition - gap },
		gap,
		null,
	)
	hunk.hunkContent.forEach((entry, changeIndex) => {
		const source = entryKey(hunkIndex, changeIndex)
		if (entry.type === 'context') {
			pushContext(rows, at, entry.lines, source)
			at.deletion += entry.lines
			at.addition += entry.lines
			return
		}
		pushChange(rows, at, entry, source)
		at.deletion += entry.deletions
		at.addition += entry.additions
	})
	return at
}

// The whole file of a full (non-partial) diff: each hunk's collapsed run before it, its entries, and the unchanged tail after the last.
export function walkRows(diff: FileDiffMetadata): Row[] {
	const rows: Row[] = []
	let end: Cursor = { deletion: 0, addition: 0 }
	diff.hunks.forEach((hunk, hunkIndex) => {
		end = pushHunk(rows, hunk, hunkIndex)
	})
	const tail = Math.min(
		diff.deletionLines.length - end.deletion,
		diff.additionLines.length - end.addition,
	)
	pushContext(rows, end, Math.max(tail, 0), null)
	return rows
}

function holds(spans: readonly LineSpan[], index: number): boolean {
	return spans.some(span => index + 1 >= span.start && index + 1 <= span.end)
}

function isInside(row: Row, window: RowWindow): boolean {
	return (
		(row.hasDeletion && holds(window.deletions, row.deletion)) ||
		(row.hasAddition && holds(window.additions, row.addition))
	)
}

// The window's rows, each run framed by one context row either side when the file has one there.
export function keptRows(rows: readonly Row[], window: RowWindow): Row[] {
	const inside = rows.map(row => isInside(row, window))
	return rows.filter(
		(row, index) =>
			inside[index] === true ||
			(isContextRow(row) &&
				(inside[index - 1] === true || inside[index + 1] === true)),
	)
}

type RunEnd = { deletion: number | null; addition: number | null }

// A side breaks the run when it skips a line (a row left out between two kept ones); a side the run has not drawn yet starts wherever its first row is.
function breaksRun(row: Row, end: RunEnd): boolean {
	return (
		(row.hasDeletion &&
			end.deletion !== null &&
			row.deletion !== end.deletion + 1) ||
		(row.hasAddition &&
			end.addition !== null &&
			row.addition !== end.addition + 1)
	)
}

function advance(end: RunEnd, row: Row): RunEnd {
	return {
		deletion: row.hasDeletion ? row.deletion : end.deletion,
		addition: row.hasAddition ? row.addition : end.addition,
	}
}

// The kept rows in runs that follow each other on both sides: each run becomes one hunk.
export function splitRuns(rows: readonly Row[]): Row[][] {
	const runs: Row[][] = []
	let run: Row[] = []
	let end: RunEnd = { deletion: null, addition: null }
	for (const row of rows) {
		if (breaksRun(row, end)) {
			runs.push(run)
			run = []
			end = { deletion: null, addition: null }
		}
		run.push(row)
		end = advance(end, row)
	}
	if (run.length) runs.push(run)
	return runs
}
