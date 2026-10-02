import type { AnnotationMeta } from '@entities/review/annotations'
import type { FileDiff, FileDiffMetadata } from '@pierre/diffs'
import type { LineMap } from '@shared/diff-renderer/linemap'

// Imperative-island state kept OUT of the reactive store: the @pierre/diffs instance holds the
// rendered diff, and does internal element/identity checks that a reactive store proxy breaks
// (e.g. ResizeManager ownership). Plain object.
export type DiffHolder = {
	// FileDiff is generic over its annotation metadata - ours is AnnotationMeta.
	instance: FileDiff<AnnotationMeta> | null
	fileDiff: FileDiffMetadata | null
	// Raw ↔ display line mapping for the current file's rendered (replayed) diff.
	// Rebuilt by replayDecisions on every render; null = identity (no decisions / view-only).
	lineMap: LineMap | null
}

export const D: DiffHolder = {
	instance: null,
	fileDiff: null,
	lineMap: null,
}
