import type { AnnotationMeta } from '@entities/review/annotations'
import type { FileDiff, FileDiffMetadata } from '@pierre/diffs'
import type { LineMap } from '@shared/diff-renderer/linemap'
import type { Side } from '@shared/diff-renderer/types'

export type LinePoint = { side: Side; line: number }

export type ChangeSpan = { side: 'add' | 'del'; top: number; bottom: number }

export type VirtualNav = {
	scrollToLine: (point: LinePoint) => boolean
	farChangeStart: (from: LinePoint, dir: 1 | -1) => LinePoint | null
	changeSpans: () => ChangeSpan[]
	cleanUp: () => void
}

export type DiffHolder = {
	instance: FileDiff<AnnotationMeta> | null
	virtual: VirtualNav | null
	fileDiff: FileDiffMetadata | null
	lineMap: LineMap | null
}

// Imperative-island state kept OUT of the reactive store: the @pierre/diffs instance does internal element/identity checks that a reactive store proxy breaks (e.g. ResizeManager ownership). Plain object.
export const D: DiffHolder = {
	instance: null,
	virtual: null,
	fileDiff: null,
	lineMap: null,
}

export function releaseDiffInstance(): void {
	D.instance?.cleanUp()
	D.virtual?.cleanUp()
	D.instance = null
	D.virtual = null
}
