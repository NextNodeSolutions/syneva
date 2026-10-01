import type { AnnotationMeta } from '@entities/review/annotations'
import type { DiffLineAnnotation } from '@pierre/diffs'

// The two render flags the diff island derives from the store per pass: whether #diff is showing
// a read-only preview, and whether unchanged lines are expanded. Fed to the metadata builder and
// the @pierre render options.
export type DiffView = { isPreviewing: boolean; isExpandedUnchanged: boolean }

// Our annotation payload handed to @pierre/diffs' renderAnnotation. The library's
// DiffLineAnnotation distributes over a union metadata type (one member per variant), so an
// annotation value is built as the member matching its metadata and the distributed union is the
// ARRAY's element type - never a single object's. Using the library's own type here keeps the two
// in step: a new variant can't be spelled on one side only.
export type AnnotationInput = DiffLineAnnotation<AnnotationMeta>
