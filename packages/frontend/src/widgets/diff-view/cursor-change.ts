import { currentChanges, currentFileOrNull } from '@entities/review/changes'

import { diffCtx } from './context'
import { D } from './runtime'

import type { ChangeState } from '@entities/review/model'
import type { ChangeContent } from '@pierre/diffs'
import type { Side } from '@shared/diff-renderer/types'

type RowSpan = { side: Side; start: number; end: number }

function isChangePart(
	entry: { type: string } | undefined,
): entry is ChangeContent {
	return entry?.type === 'change'
}

// The rows a block occupies on the rendered diff, on each side. A replacement block removes lines on the left and adds on the right, and its record carries only the side it is anchored on: the parts Pierre drew for it (change-parts.ts, since the hub's hunk index does not name them) say the rest. A change whose parts are resolved, or drawn inside a neighbour's part, stands at its own display anchors.
function rowsOf(change: ChangeState): RowSpan[] {
	const parts = (D.parts?.get(change.id) ?? [])
		.map(at => D.fileDiff?.hunks[at.hunkIndex]?.hunkContent[at.changeIndex])
		.filter(isChangePart)
	if (!parts.length) {
		const start = change.displayLineNumber ?? change.lineNumber
		const end = change.displayEndLine ?? change.endLine ?? start
		return [{ side: change.side, start, end }]
	}
	return parts.flatMap(part => {
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
	})
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
