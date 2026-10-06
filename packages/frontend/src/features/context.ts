import type { PreviewFile, ReviewState } from '@entities/review/model'
import type { Settings } from '@entities/settings/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { LineMap } from '@shared/diff-renderer/linemap'
import type { DiffStyle, Selection } from '@shared/diff-renderer/types'
import type { Side } from '@shared/diff-renderer/types'

// Bound once by app composition; no feature module imports @app; this is the features layer's own seam (like shared/lib/render-scheduler) every slice reads, so it stays importable across slices by design.
export interface FeatureStoreView {
	state: ReviewState | null
	settings: Settings
	selected: Selection
	preview: PreviewFile | null
	fileIndex: number
	diffStyle: DiffStyle
	composerOpen: boolean
	fileComposerOpen: boolean
	composerBody: string
	editingCommentId: string | null
	overviewOpen: boolean
	fileView: 'rendered' | 'source'
	awaitingAgent: boolean
	lastBaseDiffHash: string | null
	projectFiles: string[]
	golineBuffer: string
	foldExpanded: Set<string>
	promptFinish?: () => void
	selectFile?: (i: number) => void
	afterSignOff?: (path: string) => void
	ask?: () => void
	requestChange?: () => void
	saveComment?: () => void
}

export interface FeatureServices {
	S: FeatureStoreView
	requireState: () => ReviewState
	persist: () => void
	toast: (message: string) => void
	fileDiff: () => FileDiffMetadata | null
	lineMap: () => LineMap | null
	diffInstance: () => {
		options: { expandUnchanged?: boolean }
		expandHunk: (
			regionIndex: number,
			direction: 'up' | 'down',
			lines: number,
		) => unknown
	} | null
	cursorSyncTo: (side: Side, line: number) => void
	cursorSelection: () => { side: Side; lineNumber: number } | null
}

export type FeatureCtx = FeatureServices

let ctx: FeatureCtx | null = null

export function bindFeatureCtx(bound: FeatureCtx): void {
	ctx = bound
}

export function featureCtx(): FeatureCtx {
	if (!ctx)
		throw new Error('feature context read before app composition bound it')
	return ctx
}
