import type { PreviewFile, ReviewState } from '@entities/review/model'
import type { NoteThreadRef } from '@entities/review/notes'
import type { Settings } from '@entities/settings/model'
import type { DiffStyle, Selection } from '@shared/diff-renderer/types'
import type { DiffHolder } from './runtime'

export interface DiffStoreView {
	state: ReviewState | null
	settings: Settings
	selected: Selection
	preview: PreviewFile | null
	diffStyle: DiffStyle
	fileIndex: number
	fileView: 'rendered' | 'source'
	composerOpen: boolean
	fileComposerOpen: boolean
	composerBody: string
	editingCommentId: string | null
	overviewOpen: boolean
	expandedDirs: Set<string>
	collapsedDirs: Set<string>
	golineBuffer: string
	loadedOversized: Set<string>
	foldExpanded: Set<string>
	awaitingAgent: boolean
	agentActivity: string | null
	diffScrolled: boolean
	toastMsg: string
	projectFiles: string[]
	queuedQuestions: number
	queuedReviews: number
	lastBaseDiffHash: string | null
	deskClosed?: boolean
	isRefreshRequired?: boolean
	setStyle?: (style: DiffStyle) => void
	openInEditor?: () => Promise<void>
	toggleFileComposer?: () => void
	selectFile?: (i: number) => void
	previewFile?: (path: string) => void
	startGuided?: () => void
	noteResolved?: (ref: NoteThreadRef) => void
}

export interface DiffServices {
	deferRender: () => void
	persist: () => void
	toast: (message: string) => void
}

export interface DiffCtx {
	S: DiffStoreView
	D: DiffHolder
	requireState: () => ReviewState
}

let ctx: (DiffCtx & DiffServices) | null = null

export function bindDiffCtx(bound: DiffCtx & DiffServices): void {
	ctx = bound
}

export function diffCtx(): DiffCtx & DiffServices {
	if (!ctx)
		throw new Error(
			'diff view context read before app composition bound it',
		)
	return ctx
}
