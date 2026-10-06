import type { Side } from '@shared/diff-renderer/types'
import type { ReviewComment } from './model'

// Pure data only: the @pierre-typed annotation wrapper (DiffLineAnnotation<AnnotationMeta>) stays in widgets/diff-view/types.ts, the only place that instantiates the library generic.
export type ThreadMeta = {
	type: 'thread'
	path: string
	side: Side
	lineNumber: number
	status: 'open' | 'resolved'
	comments: ReviewComment[]
	changeId?: string | undefined
	fileLevel?: boolean | undefined
}
export type ChangeMeta = {
	type: 'change'
	id: string
	side: Side
	lineNumber: number
	title: string
	path: string
}
// lineNumber is the display line the composer anchors under - it re-derives from S.selected on every render, so it tracks the selection across decision replays like any other annotation.
export type ComposerMeta = {
	type: 'composer'
	side: Side
	lineNumber: number
	path: string
}
export type AnnotationMeta = ThreadMeta | ChangeMeta | ComposerMeta
