// Frontend-owned review models: the shapes the desk's UI state and API-boundary
// mappers produce. Declared structurally here (NOT re-exported from @contracts)
// so contract DTOs cannot escape the entity API boundaries - the browser consumes
// these models only, and api.ts is the single place wire payloads are decoded onto
// them. Keep structurally in sync with packages/contracts/src/review.ts / browser.ts when
// the wire shape changes. Optional props are explicitly `T | undefined` (not bare `?`):
// the decoders assemble these records with explicit undefined keys, and the repo checks
// under exactOptionalPropertyTypes.

// ── Review domain records (structural mirrors of the shared wire records) ──
export type ReviewMode = 'repo' | 'file' | 'pr'

export type ReviewComment = {
	id: string
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	endLine?: number | undefined
	body: string
	createdAt: string
	updatedAt: string
	status: 'open' | 'resolved' | 'stale'
	intent?: 'note' | 'action' | 'question' | undefined
	role?: 'user' | 'agent' | undefined
	anchorText?: string | undefined
	unanchored?: boolean | undefined
	anchor?: 'file' | undefined
}

export type ChangeState = {
	id: string
	path: string
	hunkIndex: number
	changeIndex?: number | undefined
	side: 'additions' | 'deletions'
	lineNumber: number
	endLine?: number | undefined
	title: string
	stableKey?: string | undefined
	status: 'pending' | 'accepted' | 'rejected'
	stageable?: boolean | undefined
	contentHash?: string | undefined
	reviewedHash?: string | undefined
	displayLineNumber?: number | undefined
	displayEndLine?: number | undefined
}

// Explicit, durable accept/reject record keyed `path:stableKey` (see packages/contracts/src/review.ts).
export type Decision = {
	key: string
	status: 'accepted' | 'rejected'
	reviewedHash?: string | undefined
	path: string
	lineNumber: number
	side: 'additions' | 'deletions'
	title: string
}

export type GuideFile = {
	path: string
	order: number
	category: string
}

export type Guide = {
	files: GuideFile[]
	baseDiffHash?: string | undefined
}

// One review file as the browser sees it: metadata only - the renderer builds its
// own hunks from /file-contents, so no diff bodies ride the state.
export type ReviewFile = {
	path: string
	oldPath?: string | undefined
	newPath?: string | undefined
	contentHash: string
	changeKind?: 'added' | 'modified' | 'deleted' | 'renamed' | undefined
	renamePure?: boolean | undefined
	oversized?: boolean | undefined
	size?: number | undefined
	added: number
	removed: number
	hasHunks: boolean
}

// File-level review state: pending / approved / changes-requested - the single source of truth
// for a changed file's badge/header/progress state (see changes.ts fileReviewState).
export type FileReviewState = 'pending' | 'approved' | 'changes-requested'

// A previewed file (opened from the project tree via /file to read/comment on an unchanged
// file) is a UI-only construct: it never rides the wire or persistence, so it carries its single
// contents inline (old === new, no diff) rather than through the on-demand /file-contents
// fetch that lean ReviewFiles use. file/contents.ts reads previewContents for it; everything else
// treats it as an ordinary (zero-hunk) ReviewFile.
export type PreviewFile = ReviewFile & { previewContents: string }

// The live review the desk renders. Server/agent-owned fields are optional; the
// reviewer-owned slice (ReviewerSave) is what /save writes back.
export type ReviewState = {
	root: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
	baseDiffHash: string
	changes: ChangeState[]
	comments: ReviewComment[]
	decisions?: Decision[] | undefined
	guide?: Guide | undefined
	reviewedFiles: string[]
	reviewedFileHashes?: Record<string, string> | undefined
	stagedFiles: string[]
	stagedChangeKeys?: string[] | undefined
	decisionFiles?: string[] | undefined
	files: ReviewFile[]
}

// The reviewer-owned slice the browser posts to /save (see save.ts's reviewerSlice).
export type ReviewerSave = Pick<
	ReviewState,
	| 'decisions'
	| 'comments'
	| 'reviewedFiles'
	| 'reviewedFileHashes'
	| 'decisionFiles'
>

// ── Desk liveness (transient, never persisted) ─────────────────────────────
export type AgentActivity = { body: string; at: string }

export type DeskStatus = {
	agentActivity: AgentActivity | null
	agentListening: boolean
	queuedQuestions: number
	queuedReviews: number
}

// GET /state: the full browser review snapshot plus the desk's liveness fields
// and the server instance id the poll guard compares against.
export type DeskStateSnapshot = ReviewState &
	DeskStatus & { serverInstanceId?: string | undefined }

// GET /poll: just enough to detect change. File summaries and change records belong
// on /state, fetched on baseDiffHash changes, not on every tick. A mismatched
// ?instance= from an older desk process receives a refresh event instead. DeskStatus
// rides both.
export type DeskPollSnapshot = Pick<
	ReviewState,
	'baseDiffHash' | 'guide' | 'comments'
>

// A process change asks the tab to refresh its bundle before adopting another server's state.
export type DeskRefreshEvent = { kind: 'refresh' }
