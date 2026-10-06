import type { ContextContent, FileDiffMetadata } from '@pierre/diffs'
import type { DecidedPosition } from '@shared/diff-renderer/linemap'

// With the "hide accepted" pref on, an already-ACCEPTED decision's band replays into a plain context run round after round; this transform drops its rows entirely: each accepted entry becomes a zero-row context placeholder, so positions stay invariant.
// Every consumer (anchors, annotations, cursor, windowing) keeps working unchanged; accepted bands become EQUAL merged context runs on both sides after replay, so the two side counters advance in lockstep.

type Line = FileDiffMetadata['deletionLines'][number]
type ContentEntry = FileDiffMetadata['hunks'][number]['hunkContent'][number]

const entryKey = (hunkIndex: number, changeIndex: number): string =>
	`${hunkIndex}:${changeIndex}`

function contextRows(entry: ContextContent, from: FileDiffMetadata): Line[] {
	const rows: Line[] = []
	for (let i = 0; i < entry.lines; i++) {
		const row =
			from.additionLines[entry.additionLineIndex + i] ??
			from.deletionLines[entry.deletionLineIndex + i]
		if (row) rows.push(row)
	}
	return rows
}

function distilledCacheKey(
	diff: FileDiffMetadata,
): { cacheKey: string } | undefined {
	if (!diff.cacheKey) return undefined
	return { cacheKey: `${diff.cacheKey}:distilled` }
}

export function distillAccepted(
	diff: FileDiffMetadata,
	cuts: DecidedPosition[],
): FileDiffMetadata {
	if (!cuts.length) return diff
	const cutSet = new Set(
		cuts.map(cut => entryKey(cut.hunkIndex, cut.changeIndex)),
	)
	const deletionRows: Line[] = []
	const additionRows: Line[] = []
	let deletionLength = 0
	let additionLength = 0
	let nextDeletionStart = 1
	let nextAdditionStart = 1
	let splitLineCount = 0
	let unifiedLineCount = 0
	const hunks = diff.hunks.map((hunk, hunkIndex) => {
		const collapseRows =
			hunk.collapsedBefore > 0 && !diff.isPartial
				? hunk.collapsedBefore
				: 0
		for (let i = 0; i < collapseRows; i++) {
			const deletionRow =
				diff.deletionLines[hunk.deletionLineIndex - collapseRows + i]
			const additionRow =
				diff.additionLines[hunk.additionLineIndex - collapseRows + i]
			if (deletionRow) deletionRows.push(deletionRow)
			if (additionRow) additionRows.push(additionRow)
		}
		deletionLength += collapseRows
		additionLength += collapseRows
		nextDeletionStart += collapseRows
		nextAdditionStart += collapseRows
		splitLineCount += collapseRows
		unifiedLineCount += collapseRows
		const content: ContentEntry[] = []
		const open = {
			additionStart: nextAdditionStart,
			deletionStart: nextDeletionStart,
			additionLineIndex: additionLength,
			deletionLineIndex: deletionLength,
			splitLineStart: splitLineCount,
			unifiedLineStart: unifiedLineCount,
		}
		const totals = {
			additionCount: 0,
			deletionCount: 0,
			additionLines: 0,
			deletionLines: 0,
			splitLineCount: 0,
			unifiedLineCount: 0,
		}
		hunk.hunkContent.forEach((entry, changeIndex) => {
			if (cutSet.has(entryKey(hunkIndex, changeIndex))) {
				content.push({
					type: 'context',
					lines: 0,
					deletionLineIndex: open.deletionLineIndex,
					additionLineIndex: open.additionLineIndex,
				} satisfies ContextContent)
				return
			}
			content.push({
				...entry,
				deletionLineIndex: deletionLength,
				additionLineIndex: additionLength,
			})
			if (entry.type === 'context') {
				for (const line of contextRows(entry, diff)) {
					deletionRows.push(line)
					additionRows.push(line)
				}
				deletionLength += entry.lines
				additionLength += entry.lines
				nextDeletionStart += entry.lines
				nextAdditionStart += entry.lines
				splitLineCount += entry.lines
				unifiedLineCount += entry.lines
				totals.additionCount += entry.lines
				totals.deletionCount += entry.lines
				totals.splitLineCount += entry.lines
				totals.unifiedLineCount += entry.lines
				return
			}
			const rows = Math.max(entry.deletions, entry.additions)
			for (let i = 0; i < rows; i++) {
				if (i < entry.deletions) {
					const line = diff.deletionLines[entry.deletionLineIndex + i]
					if (!line)
						throw new Error(
							`distill: missing deletion row ${entry.deletionLineIndex + i}`,
						)
					deletionRows.push(line)
				}
				if (i < entry.additions) {
					const line = diff.additionLines[entry.additionLineIndex + i]
					if (!line)
						throw new Error(
							`distill: missing addition row ${entry.additionLineIndex + i}`,
						)
					additionRows.push(line)
				}
			}
			deletionLength += entry.deletions
			additionLength += entry.additions
			nextDeletionStart += entry.deletions
			nextAdditionStart += entry.additions
			splitLineCount += rows
			unifiedLineCount += entry.deletions + entry.additions
			totals.additionCount += entry.additions
			totals.deletionCount += entry.deletions
			totals.additionLines += entry.additions
			totals.deletionLines += entry.deletions
			totals.splitLineCount += rows
			totals.unifiedLineCount += entry.deletions + entry.additions
		})
		return {
			...hunk,
			hunkContent: content,
			...open,
			...totals,
			splitLineCount: splitLineCount - open.splitLineStart,
			unifiedLineCount: unifiedLineCount - open.unifiedLineStart,
		}
	})
	const last = diff.hunks.at(-1)
	if (last && !diff.isPartial) {
		const deletionEnd = last.deletionLineIndex + last.deletionCount
		const additionEnd = last.additionLineIndex + last.additionCount
		const count = Math.min(
			diff.deletionLines.length - deletionEnd,
			diff.additionLines.length - additionEnd,
		)
		for (let i = 0; i < count; i++) {
			const deletionRow = diff.deletionLines[deletionEnd + i]
			const additionRow = diff.additionLines[additionEnd + i]
			if (deletionRow) deletionRows.push(deletionRow)
			if (additionRow) additionRows.push(additionRow)
		}
	}
	return {
		...diff,
		...distilledCacheKey(diff),
		hunks,
		deletionLines: deletionRows,
		additionLines: additionRows,
		splitLineCount,
		unifiedLineCount,
	}
}
