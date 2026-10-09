import type { TreeRow } from '@entities/review/file/tree-rows'
import type { CodeSpan } from '@entities/review/guide/model'
import type { GuideReturnPoint } from '@entities/review/guide/return-point'
import type { PreviewFile, ReviewState } from '@entities/review/model'
import type {
	NoteThreadRef,
	NotesLens,
	ReviewNote,
} from '@entities/review/notes'
import type { Settings } from '@entities/settings/model'
import type { DiffStyle, Selection } from '@shared/diff-renderer/types'
import type { ResetScope } from '@syneva/contracts/review'

// Data fields are the source of truth; the methods are attached by the app facade modules for the chrome to call through the store view (hence optional on the data literal).
export interface Store {
	// Or null before main.ts adopts the initial fetch; operations that need a review go through requireState().
	state: ReviewState | null
	projectFiles: string[]
	expandedDirs: Set<string>
	collapsedDirs: Set<string>
	diffStyle: DiffStyle
	fileIndex: number
	// A non-review file (e.g. unchanged) the reviewer opened to read/comment on; when set, it is the "current file" instead of state.files[fileIndex].
	preview: PreviewFile | null
	awaitingAgent: boolean
	// Held OUTSIDE S.state so they never ride a /save round-trip into the persisted review.
	agentActivity: string | null
	agentListening: boolean
	queuedQuestions: number
	queuedReviews: number
	lastBaseDiffHash: string | null
	isRefreshRequired: boolean
	deskClosed: boolean
	selected: Selection
	composerOpen: boolean
	fileComposerOpen: boolean
	toastMsg: string
	golineBuffer: string
	composerBody: string
	editingCommentId: string | null
	settings: Settings
	settingsOpen: boolean
	settingsTab: 'settings' | 'shortcuts'
	confirmMsg: string
	sendOpen: boolean
	sendMsg: string
	sendNote: string
	confirmClose?: () => void
	overviewOpen: boolean
	sidebarTab: 'tree' | 'walkthrough'
	treeDrawerOpen: boolean
	fileView: 'rendered' | 'source'
	diffScrolled: boolean
	foldExpanded: Set<string>
	// Per-session and never persisted - the oversized stamp is server-owned and re-derived on reload.
	loadedOversized: Set<string>
	notesOpen: boolean
	notesQuery: string
	notesLens: NotesLens
	notesCursor: number
	// A tick instead of a boolean so repeating '/' refocuses even after the field kept focus.
	notesSearchTick: number
	notesAdvanceAfter: { ref: NoteThreadRef; pos: number } | null
	// The guided review's position: the selected domain (its explanation beside the diff), the pane's visibility, the block details the reviewer opened, and where a reference follow came from (Back).
	domainId: string | null
	guidePaneOpen: boolean
	guideExpanded: Set<string>
	guideReturn: GuideReturnPoint[]
	// Bumped when the Markdown engine (lazy) lands or repaints, so React prose re-renders with it.
	markdownTick: number

	treeRows?: () => TreeRow[]
	selectFile?: (i: number) => void
	previewFile?: (path: string) => void
	// Land on original-side code: a guide reference's target or an owned block, in the diff or as a preview.
	jumpToSpan?: (span: CodeSpan) => void
	selectDomain?: (id: string) => void
	stepDomain?: (direction: 1 | -1) => void
	stepDomainChange?: (direction: 1 | -1) => void
	followReference?: (domainId: string, refId: string) => void
	guideBack?: () => void
	toggleGuidePane?: () => void
	toggleBlockDetail?: (key: string) => void
	toggleDir?: (full: string, changed: boolean) => void
	toggleAllDirs?: () => void
	treeAnyOpen?: () => boolean
	toggleTestDir?: (key: string) => void
	toggleRenamedGroup?: () => void
	toggleReviewedGroup?: () => void
	rowClick?: (r: TreeRow) => void
	setStyle?: (style: DiffStyle) => void
	setFileView?: (view: 'rendered' | 'source') => void
	isMarkdownFile?: () => boolean
	approveFile?: () => void
	// The pref persists; hasReviewed gates the header toggle (nothing to distill on first sight).
	hasReviewed?: () => boolean
	toggleHideReviewed?: () => void
	fabState?: () => 'clean' | 'changes' | null
	splitApplies?: () => boolean
	applySettings?: () => void
	openInEditor?: () => Promise<void>
	openSettings?: () => void
	closeSettings?: () => void
	hasGuide?: () => boolean
	guideStale?: () => boolean
	openOverview?: () => void
	startGuided?: () => void
	showGuideBar?: () => boolean
	curFileName?: () => string
	guideNext?: () => void
	guidePrev?: () => void
	guideAtStart?: () => boolean
	guideAtLast?: () => boolean
	saveComment?: () => void
	ask?: () => void
	requestChange?: () => void
	reset?: (scope: ResetScope) => Promise<void>
	resetMenuOpen: boolean
	setResetMenu?: (open: boolean) => void
	send?: (overallNote?: string) => Promise<void>
	closeDesk?: () => Promise<void>
	toggleFileComposer?: () => void
	openFileCommentCount?: () => number
	fileCommentAvailable?: () => boolean
	toggleNotes?: () => void
	jumpToNote?: (note: ReviewNote) => void
	setNotesQuery?: (query: string) => void
	setNotesLens?: (lens: NotesLens) => void
	notesCursorMove?: (dir: 1 | -1) => void
	notesJumpCursor?: () => void
	notesFocusSearch?: () => void
	noteResolved?: (ref: NoteThreadRef) => void
	notesAfterSignOff?: (path: string) => boolean
	nextFile?: () => void
	prevFile?: () => void
	stepInView?: (dir: 1 | -1) => void
	afterSignOff?: (path: string) => void
	treeStep?: (dir: 1 | -1) => void
	confirmYes?: () => void
	confirmNo?: () => void
	promptFinish?: () => void
	confirmSend?: () => void
	sendConfirm?: () => void
	sendCancel?: () => void
	helpGroups?: () => {
		group: string
		items: { combo: string; desc: string }[]
	}[]
}
