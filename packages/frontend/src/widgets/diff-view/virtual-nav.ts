import { $ } from '@shared/lib/dom'

import { D } from './runtime'

import type { AnnotationMeta } from '@entities/review/annotations'
import type {
	FileDiffMetadata,
	VirtualizedFileDiff,
	Virtualizer,
} from '@pierre/diffs'
import type { ChangeSpan, LinePoint, VirtualNav } from './runtime'

// The navigation a virtualized diff offers (see VirtualNav in runtime.ts): Pierre's line layout
// (getLinePosition) places any line of the file, mounted or not, relative to the file's top, and
// the virtualizer converts that into the pane's scroll space.

export type VirtualLayout = {
	virtualizer: Virtualizer
	instance: VirtualizedFileDiff<AnnotationMeta>
	// The file's own container element, whose offset in the pane anchors Pierre's positions.
	container: HTMLElement
}

type HunkEntry = FileDiffMetadata['hunks'][number]['hunkContent'][number]
type PlacedPoint = { point: LinePoint; top: number }

const HALF = 2

function lineTop(layout: VirtualLayout, point: LinePoint): number | null {
	const position = layout.instance.getLinePosition(point.line, point.side)
	if (!position) return null
	return position.top
}

function fileTop(layout: VirtualLayout): number {
	return layout.virtualizer.getOffsetInScrollContainer(layout.container)
}

// Every content entry of the rendered diff, read from its metadata.
function hunkEntries(): HunkEntry[] {
	return (D.fileDiff?.hunks ?? []).flatMap(hunk => hunk.hunkContent)
}

// A change block's first row: its deletions render first, so it starts on its first deletion
// when it has any.
function blockStart(entry: HunkEntry): LinePoint[] {
	if (entry.type !== 'change') return []
	if (entry.deletions > 0)
		return [{ side: 'deletions', line: entry.deletionLineIndex + 1 }]
	return [{ side: 'additions', line: entry.additionLineIndex + 1 }]
}

function scrollToLine(layout: VirtualLayout, point: LinePoint): boolean {
	const top = lineTop(layout, point)
	if (top === null) return false
	layout.virtualizer.scrollTo({
		top: fileTop(layout) + top - $('diff').clientHeight / HALF,
	})
	return true
}

function farChangeStart(
	layout: VirtualLayout,
	from: LinePoint,
	dir: 1 | -1,
): LinePoint | null {
	const fromTop = lineTop(layout, from)
	if (fromTop === null) return null
	const ahead: PlacedPoint[] = hunkEntries()
		.flatMap(blockStart)
		.flatMap(point => {
			const top = lineTop(layout, point)
			return top === null ? [] : [{ point, top }]
		})
		.filter(block =>
			dir === 1 ? block.top > fromTop : block.top < fromTop,
		)
	if (!ahead.length) return null
	return ahead.reduce((best, block) =>
		Math.abs(block.top - fromTop) < Math.abs(best.top - fromTop)
			? block
			: best,
	).point
}

// One side's run of a change block as a ruler span, in scroll-content coordinates.
function runSpan(
	layout: VirtualLayout,
	side: LinePoint['side'],
	first: number,
	count: number,
): ChangeSpan[] {
	if (!count) return []
	const start = layout.instance.getLinePosition(first, side)
	const end = layout.instance.getLinePosition(first + count - 1, side)
	if (!start || !end) return []
	const top = fileTop(layout)
	return [
		{
			side: side === 'additions' ? 'add' : 'del',
			top: top + start.top,
			bottom: top + end.top + end.height,
		},
	]
}

// A change block's deletion and addition runs, as ruler spans.
function blockSpans(layout: VirtualLayout, entry: HunkEntry): ChangeSpan[] {
	if (entry.type !== 'change') return []
	return runSpan(
		layout,
		'deletions',
		entry.deletionLineIndex + 1,
		entry.deletions,
	).concat(
		runSpan(
			layout,
			'additions',
			entry.additionLineIndex + 1,
			entry.additions,
		),
	)
}

function changeSpans(layout: VirtualLayout): ChangeSpan[] {
	return hunkEntries()
		.flatMap(entry => blockSpans(layout, entry))
		.toSorted((a, b) => a.top - b.top)
}

export function virtualNav(layout: VirtualLayout): VirtualNav {
	return {
		scrollToLine: point => scrollToLine(layout, point),
		farChangeStart: (from, dir) => farChangeStart(layout, from, dir),
		changeSpans: () => changeSpans(layout),
		cleanUp: () => layout.virtualizer.cleanUp(),
	}
}
