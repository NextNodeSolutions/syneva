// Declared structurally here (NOT re-exported from @contracts) so contract DTOs cannot escape the entity API boundaries.
// Keep structurally in sync with packages/contracts/src/review.ts / browser.ts; optional props are explicitly `T | undefined` under exactOptionalPropertyTypes.
import type { Guide, GuideResolution } from './guide/model'

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

// Feedback on the guide: a thread on a domain, or on one of its explanation blocks, anchored by stable ids under the guide it was written against, with the code the target pointed at then (mirrors contracts/review.ts).
export type DomainCodeRef = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	endLine?: number | undefined
	label?: string | undefined
}

export type DomainTarget = {
	guideFingerprint: string
	domainId: string
	blockId?: string | undefined
	domainTitle: string
	blockTitle?: string | undefined
	refs: DomainCodeRef[]
}

export type DomainComment = {
	id: string
	target: DomainTarget
	body: string
	createdAt: string
	updatedAt: string
	status: 'open' | 'resolved' | 'stale'
	intent?: 'note' | 'action' | 'question' | undefined
	role?: 'user' | 'agent' | undefined
	unanchored?: boolean | undefined
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

export type Decision = {
	key: string
	status: 'accepted' | 'rejected'
	reviewedHash?: string | undefined
	path: string
	lineNumber: number
	side: 'additions' | 'deletions'
	title: string
}

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

export type FileReviewState = 'pending' | 'approved' | 'changes-requested'

export type PreviewFile = ReviewFile & { previewContents: string }

export type ReviewState = {
	root: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
	baseDiffHash: string
	changes: ChangeState[]
	comments: ReviewComment[]
	domainComments: DomainComment[]
	decisions?: Decision[] | undefined
	guide?: Guide | undefined
	guideResolution?: GuideResolution | undefined
	reviewedFiles: string[]
	reviewedFileHashes?: Record<string, string> | undefined
	stagedFiles: string[]
	stagedChangeKeys?: string[] | undefined
	decisionFiles?: string[] | undefined
	files: ReviewFile[]
}

export type ReviewerSave = Pick<
	ReviewState,
	| 'decisions'
	| 'comments'
	| 'domainComments'
	| 'reviewedFiles'
	| 'reviewedFileHashes'
	| 'decisionFiles'
>

export type AgentActivity = { body: string; at: string }

export type DeskStatus = {
	agentActivity: AgentActivity | null
	agentListening: boolean
	queuedQuestions: number
	queuedReviews: number
}

export type DeskStateSnapshot = ReviewState &
	DeskStatus & { serverInstanceId?: string | undefined }

export type DeskPollSnapshot = Pick<
	ReviewState,
	'baseDiffHash' | 'guide' | 'guideResolution' | 'comments' | 'domainComments'
>

export type DeskRefreshEvent = { kind: 'refresh' }
