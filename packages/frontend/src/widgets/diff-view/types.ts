import type { AnnotationMeta } from '@entities/review/annotations'
import type { DiffLineAnnotation } from '@pierre/diffs'

export type DiffView = { isPreviewing: boolean; isExpandedUnchanged: boolean }

// The library's DiffLineAnnotation distributes over a union metadata type, so the array element type is the distributed union - using the library's own type keeps the two in step: a new variant can't be spelled on one side only.
export type AnnotationInput = DiffLineAnnotation<AnnotationMeta>
