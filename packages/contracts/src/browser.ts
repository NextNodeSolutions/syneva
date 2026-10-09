// Explicit allowlist: new backend fields stay private until picked here; hunks are built client-side from /file-contents.
import type { Guide, GuideResolution } from './guide.js'
import type {
	ChangeState,
	Decision,
	DomainComment,
	ReviewComment,
	ReviewMode,
} from './review.js'

export type BrowserReviewFile = {
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

export type BrowserReviewState = {
	root: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
	baseDiffHash: string
	changes: readonly ChangeState[]
	comments: readonly ReviewComment[]
	// Threads on the guide's domains and blocks (see DomainComment); empty without a guide.
	domainComments: readonly DomainComment[]
	decisions?: readonly Decision[] | undefined
	guide?: Guide | undefined
	// Where the guide stands against this diff: owned identities at attach, stale domains and references after reloads, the changes no domain owns.
	guideResolution?: GuideResolution | undefined
	reviewedFiles: readonly string[]
	reviewedFileHashes?: Readonly<Record<string, string>> | undefined
	stagedFiles: readonly string[]
	stagedChangeKeys?: readonly string[] | undefined
	decisionFiles?: readonly string[] | undefined
	files: readonly BrowserReviewFile[]
}

// A hub restart asks the tab to refresh its bundle before adopting the new server state.
export type BrowserRefreshEvent = { kind: 'refresh' }
export type BrowserResetResponse = {
	ok: true
	state: BrowserReviewState
	serverInstanceId: string
}

// The reviewer fills exactly these (server clears itself, latest wins); decisionFiles rides
// along to gate the per-file Reset on reload - stagedFiles/stagedChangeKeys stay server-side.
export type ReviewerSave = Pick<
	BrowserReviewState,
	| 'decisions'
	| 'comments'
	| 'domainComments'
	| 'reviewedFiles'
	| 'reviewedFileHashes'
	| 'decisionFiles'
>

// Transient desk-liveness: never persisted and never part of ReviewerSave (live process, not durable review).
export type AgentActivity = { body: string; at: string }
export type DeskStatus = {
	agentActivity: AgentActivity | null
	agentListening: boolean
	// Emitted with no waiter parked: stays undelivered (non-zero = sent, nobody picked it up).
	queuedQuestions: number
	queuedReviews: number
}

// Fetched on demand: full contents never ride /state (the tab caches by path + contentHash).
// The OIDs are blob ids for a future client-side cache, unused today.
export type FileContentsPayload = {
	path: string
	oldContents: string
	newContents: string
	oldOid: string
	newOid: string
}

// 1.5s heartbeat just enough to detect change: change records belong on /state (fetched on
// baseDiffHash), not every tick. A stale ?instance= gets a BrowserRefreshEvent instead; DeskStatus rides along.
export type PollPayload = Pick<
	BrowserReviewState,
	'baseDiffHash' | 'guide' | 'guideResolution' | 'comments' | 'domainComments'
>
