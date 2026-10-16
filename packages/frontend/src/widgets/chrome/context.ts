import type { TreeRow } from '@entities/review/file/tree-rows'
import type { CodeSpan } from '@entities/review/guide/model'
import type { GuideReturnPoint } from '@entities/review/guide/return-point'
import type { PreviewFile, ReviewState } from '@entities/review/model'
import type { ReviewNote } from '@entities/review/notes'
import type { Settings } from '@entities/settings/model'
import type { DiffStyle } from '@shared/diff-renderer/types'
import type { ResetScope } from '@syneva/contracts/review'

export interface ChromeStoreView {
	state: ReviewState | null
	settings: Settings
	fileIndex: number
	foldExpanded: Set<string>
	preview: PreviewFile | null
	overviewOpen: boolean
	awaitingAgent: boolean
	agentActivity: string | null
	agentListening: boolean
	queuedQuestions: number
	queuedReviews: number
	lastBaseDiffHash: string | null
	deskClosed: boolean
	isRefreshRequired: boolean
	diffStyle: DiffStyle
	composerOpen: boolean
	fileComposerOpen: boolean
	toastMsg: string
	golineBuffer: string
	composerBody: string
	editingCommentId: string | null
	notesOpen: boolean
	notesQuery: string
	notesLens: 'all' | 'open' | 'resolved'
	notesCursor: number
	notesSearchTick: number
	settingsOpen: boolean
	settingsTab: 'settings' | 'shortcuts'
	confirmMsg: string
	sendOpen: boolean
	sendMsg: string
	sendNote: string
	sidebarTab: 'tree' | 'walkthrough'
	treeDrawerOpen: boolean
	fileView: 'rendered' | 'source'
	diffScrolled: boolean
	domainId: string | null
	guidePaneOpen: boolean
	guideExpanded: Set<string>
	guideReturn: GuideReturnPoint[]
	markdownTick: number

	treeRows?(): TreeRow[]
	selectFile?(i: number): void
	previewFile?(path: string): void
	jumpToSpan?(span: CodeSpan): void
	selectDomain?(id: string): void
	stepDomain?(direction: 1 | -1): void
	stepDomainChange?(direction: 1 | -1): void
	followReference?(domainId: string, refId: string): void
	guideBack?(): void
	toggleGuidePane?(): void
	toggleBlockDetail?(key: string): void
	toggleDir?(full: string, changed: boolean): void
	toggleAllDirs?(): void
	treeAnyOpen?(): boolean
	toggleTestDir?(key: string): void
	toggleRenamedGroup?(): void
	toggleReviewedGroup?(): void
	rowClick?(r: TreeRow): void
	setStyle?(style: DiffStyle): void
	setFileView?(view: 'rendered' | 'source'): void
	isMarkdownFile?(): boolean
	approveFile?(): void
	hasReviewed?(): boolean
	toggleHideReviewed?(): void
	fabState?(): 'clean' | 'changes' | null
	applySettings?(): void
	openSettings?(): void
	closeSettings?(): void
	hasGuide?(): boolean
	guideStale?(): boolean
	openOverview?(): void
	startGuided?(): void
	showGuideBar?(): boolean
	curFileName?(): string
	guideNext?(): void
	guidePrev?(): void
	guideAtStart?(): boolean
	guideAtLast?(): boolean
	toggleNotes?(): void
	jumpToNote?(note: ReviewNote): void
	setNotesQuery?(query: string): void
	setNotesLens?(lens: 'all' | 'open' | 'resolved'): void
	notesCursorMove?(dir: 1 | -1): void
	notesJumpCursor?(): void
	saveComment?(): void
	ask?(): void
	requestChange?(): void
	reset?(scope: ResetScope): Promise<void>
	resetMenuOpen: boolean
	setResetMenu?(open: boolean): void
	send?(overallNote?: string): Promise<void>
	closeDesk?(): Promise<void>
	toggleFileComposer?(): void
	openFileCommentCount?(): number
	fileCommentAvailable?(): boolean
	confirmYes?(): void
	confirmNo?(): void
	confirmSend?(): void
	sendConfirm?(): void
	sendCancel?(): void
	helpGroups?(): {
		group: string
		items: { combo: string; desc: string }[]
	}[]
}

let ctx: { S: ChromeStoreView } | null = null

export function bindChromeCtx(bound: ChromeStoreView): void {
	ctx = { S: bound }
}

export function chromeCtx(): { S: ChromeStoreView } {
	if (!ctx)
		throw new Error('chrome context read before app composition bound it')
	return ctx
}
