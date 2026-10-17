import { toDisplayLine } from '@entities/review/changes'

import type { ChangeParts } from '@entities/review/change/change-parts'
import type { Brick } from '@entities/review/guide/bricks'
import type { ChangeState, ChangeSymbol } from '@entities/review/model'
import type { ChangeContent, FileDiffMetadata } from '@pierre/diffs'
import type { DecidedPosition, LineMap } from '@shared/diff-renderer/linemap'
import type { LineSpan, RowWindow } from '@shared/diff-renderer/trim-rows'
import type { Side } from '@shared/diff-renderer/types'

// The rows of a brick in the diff a pass draws (brick-focus.ts cuts the code to them): the declaration's lines on each side and every row of its blocks, so a block the hub filed under the brick is never cut out of it. The rows are numbered as the gutter numbers them: the replay of the decisions renumbers the raw file.

type Entry = FileDiffMetadata['hunks'][number]['hunkContent'][number]

// What a pass draws and how it got there: the raw parse, its replay (the drawn diff), the parts each change owns in both, the raw-to-drawn line map and the decided parts the replay resolved.
export type CutSource = {
	raw: FileDiffMetadata
	diff: FileDiffMetadata
	parts: ChangeParts
	lineMap: LineMap | null
	decided: readonly DecidedPosition[]
}

function lines(start: number, count: number): LineSpan[] {
	return count > 0 ? [{ start, end: start + count - 1 }] : []
}

function isChangePart(entry: Entry | undefined): entry is ChangeContent {
	return entry?.type === 'change'
}

// A part's rows in the replayed diff: a pending part's removed and added rows, a decided one's context rows on both sides.
function entryRows(entry: Entry): RowWindow {
	if (entry.type === 'context')
		return {
			deletions: lines(entry.deletionLineIndex + 1, entry.lines),
			additions: lines(entry.additionLineIndex + 1, entry.lines),
		}
	return {
		deletions: lines(entry.deletionLineIndex + 1, entry.deletions),
		additions: lines(entry.additionLineIndex + 1, entry.additions),
	}
}

// The raw lines "hide accepted" took out of the drawing, on each side: every row of a part it cut. The line map folds such a line onto the rows before the band, so a span is never mapped from one.
function cutLines(cut: CutSource): RowWindow {
	const parts = cut.decided
		.filter(at => at.status === 'cut')
		.map(at => cut.raw.hunks[at.hunkIndex]?.hunkContent[at.changeIndex])
		.filter(isChangePart)
	return {
		deletions: parts.flatMap(part =>
			lines(part.deletionLineIndex + 1, part.deletions),
		),
		additions: parts.flatMap(part =>
			lines(part.additionLineIndex + 1, part.additions),
		),
	}
}

type Mapping = { lineMap: LineMap | null; gone: RowWindow }

function isGone(spans: readonly LineSpan[], line: number): boolean {
	return spans.some(span => line >= span.start && line <= span.end)
}

// A raw range's rows in the drawn numbering, its ends moved in past the lines no longer drawn; none when no line of it is.
function shownSpan(side: Side, range: LineSpan, map: Mapping): LineSpan[] {
	const gone = map.gone[side]
	let { start, end } = range
	while (start <= end && isGone(gone, start)) start++
	while (end >= start && isGone(gone, end)) end--
	if (start > end) return []
	return [
		{
			start: toDisplayLine(side, start, map.lineMap),
			end: toDisplayLine(side, end, map.lineMap),
		},
	]
}

// A block's rows: the parts Pierre drew of it, or its own lines on its side when it owns none.
function blockRows(
	change: ChangeState,
	cut: CutSource,
	map: Mapping,
): RowWindow[] {
	const drawn = (cut.parts.get(change.id) ?? []).flatMap(at => {
		const entry = cut.diff.hunks[at.hunkIndex]?.hunkContent[at.changeIndex]
		return entry ? [entryRows(entry)] : []
	})
	if (drawn.length) return drawn
	const own = shownSpan(
		change.side,
		{ start: change.lineNumber, end: change.endLine ?? change.lineNumber },
		map,
	)
	return [
		change.side === 'deletions'
			? { deletions: own, additions: [] }
			: { deletions: [], additions: own },
	]
}

function declarationRows(
	symbol: ChangeSymbol | undefined,
	map: Mapping,
): RowWindow {
	const span = (side: Side, range: ChangeSymbol['before']): LineSpan[] =>
		range
			? shownSpan(
					side,
					{ start: range.startLine, end: range.endLine },
					map,
				)
			: []
	return {
		deletions: span('deletions', symbol?.before),
		additions: span('additions', symbol?.after),
	}
}

export function brickWindow(brick: Brick, cut: CutSource): RowWindow {
	const map = { lineMap: cut.lineMap, gone: cutLines(cut) }
	const all = [
		declarationRows(brick.symbol, map),
		...brick.changes.flatMap(change => blockRows(change, cut, map)),
	]
	return {
		deletions: all.flatMap(rows => rows.deletions),
		additions: all.flatMap(rows => rows.additions),
	}
}
