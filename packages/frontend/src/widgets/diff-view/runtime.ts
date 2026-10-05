import type { AnnotationMeta } from '@entities/review/annotations'
import type { FileDiff, FileDiffMetadata } from '@pierre/diffs'
import type { LineMap } from '@shared/diff-renderer/linemap'
import type { Side } from '@shared/diff-renderer/types'

export type LinePoint = { side: Side; line: number }

// A change run's vertical span in the scrolled content, as the overview ruler paints it.
export type ChangeSpan = { side: 'add' | 'del'; top: number; bottom: number }

// What a virtualized diff (diff-instance.ts, virtual-nav.ts) offers the code that would otherwise
// read every row from the DOM: it mounts only the rows around the viewport, so the cursor's jumps
// and the overview ruler fall back on Pierre's own line layout through these. Built inside the
// diff island, so none of it weighs on the initial bundle.
export type VirtualNav = {
	// Scroll a line that may not be mounted to the middle of the pane; whether it scrolled.
	scrollToLine: (point: LinePoint) => boolean
	// The next (dir 1) or previous (dir -1) change block past `from`, mounted or not.
	farChangeStart: (from: LinePoint, dir: 1 | -1) => LinePoint | null
	// Every change run of the file, top to bottom, in scroll-content coordinates.
	changeSpans: () => ChangeSpan[]
	// Release the virtualizer the instance renders through.
	cleanUp: () => void
}

// Imperative-island state kept OUT of the reactive store: the @pierre/diffs instance holds the
// rendered diff, and does internal element/identity checks that a reactive store proxy breaks
// (e.g. ResizeManager ownership). Plain object.
export type DiffHolder = {
	// FileDiff is generic over its annotation metadata - ours is AnnotationMeta.
	instance: FileDiff<AnnotationMeta> | null
	// Set only while the mounted diff is virtualized; released with the instance.
	virtual: VirtualNav | null
	fileDiff: FileDiffMetadata | null
	// Raw ↔ display line mapping for the current file's rendered (replayed) diff.
	// Set from the (memoized) decision replay on every pass; null = identity (no decisions /
	// view-only).
	lineMap: LineMap | null
}

export const D: DiffHolder = {
	instance: null,
	virtual: null,
	fileDiff: null,
	lineMap: null,
}

// Release the mounted renderer and the virtualizer it renders through: another view takes the
// pane, or another file mounts its own surface.
export function releaseDiffInstance(): void {
	D.instance?.cleanUp()
	D.virtual?.cleanUp()
	D.instance = null
	D.virtual = null
}
