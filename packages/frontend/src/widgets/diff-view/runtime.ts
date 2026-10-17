import type { AnnotationMeta } from '@entities/review/annotations'
import type { ChangeParts } from '@entities/review/change/change-parts'
import type { Brick } from '@entities/review/guide/bricks'
import type { CodeSpan } from '@entities/review/guide/model'
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

// The brick the rendered diff is cut to (brick-focus.ts), and the nearest blocks of the file outside it either way: where the change keys go from its edge.
export type BrickFocus = {
	brick: Brick
	next: CodeSpan | null
	prev: CodeSpan | null
}

export type DiffHolder = {
	instance: FileDiff<AnnotationMeta> | null
	virtual: VirtualNav | null
	fileDiff: FileDiffMetadata | null
	lineMap: LineMap | null
	// The parts of the rendered diff each of the shown file's changes owns (change-parts.ts), by change id.
	parts: ChangeParts | null
	// Null while the whole file is drawn.
	focus: BrickFocus | null
}

// Imperative-island state kept OUT of the reactive store: the @pierre/diffs instance does internal element/identity checks that a reactive store proxy breaks (e.g. ResizeManager ownership). Plain object.
export const D: DiffHolder = {
	instance: null,
	virtual: null,
	fileDiff: null,
	lineMap: null,
	parts: null,
	focus: null,
}

export function releaseDiffInstance(): void {
	D.instance?.cleanUp()
	D.virtual?.cleanUp()
	D.instance = null
	D.virtual = null
}
