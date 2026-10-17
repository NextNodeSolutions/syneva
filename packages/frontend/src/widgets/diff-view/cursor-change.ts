import { currentChanges, currentFileOrNull } from '@entities/review/changes'

import { diffCtx } from './context'
import { D } from './runtime'

import type { ChangeState } from '@entities/review/model'
import type { Side } from '@shared/diff-renderer/types'

type RowSpan = { side: Side; start: number; end: number }

// The rows a block occupies on the rendered diff, on each side. A replacement block removes lines on the left and adds on the right, and its record carries only the side it is anchored on: the part Pierre cut it from says the rest. Without that part (a block the render has not placed), the record's own display anchors stand.
function rowsOf(change: ChangeState): RowSpan[] {
	const part =
		typeof change.changeIndex === 'number'
			? D.fileDiff?.hunks[change.hunkIndex]?.hunkContent[
					change.changeIndex
				]
			: undefined
	if (!part || part.type !== 'change') {
		const start = change.displayLineNumber ?? change.lineNumber
		const end = change.displayEndLine ?? change.endLine ?? start
		return [{ side: change.side, start, end }]
	}
	const spans: RowSpan[] = []
	if (part.deletions > 0)
		spans.push({
			side: 'deletions',
			start: part.deletionLineIndex + 1,
			end: part.deletionLineIndex + part.deletions,
		})
	if (part.additions > 0)
		spans.push({
			side: 'additions',
			start: part.additionLineIndex + 1,
			end: part.additionLineIndex + part.additions,
		})
	return spans
}

// The shown file's change whose rows hold this displayed row, on either side of the block.
export function changeAtRow(row: {
	side: Side
	line: number
}): ChangeState | null {
	const { S } = diffCtx()
	const file = currentFileOrNull(S.state?.files, S.preview, S.fileIndex)
	return (
		currentChanges(S.state, file).find(change =>
			rowsOf(change).some(
				span =>
					span.side === row.side &&
					row.line >= span.start &&
					row.line <= span.end,
			),
		) ?? null
	)
}
