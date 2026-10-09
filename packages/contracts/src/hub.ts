import type { AgentActivity } from './browser.js'
import type { ReviewMode } from './review.js'

// Live state at request time - never persisted.
export type DeskSummary = {
	// Stable per repo+session: the same id and /d/<id>/ URL across hub restarts.
	id: string
	root: string
	project: string
	// Stable per repo root (a digest of it, like the desk id): the dashboard's project page is
	// keyed on it (projectPagePath), so two repos sharing a directory name never share a page.
	projectId: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
	baseDiffHash: string
	// Nothing to review yet (clean branch at base): waits for the next reload instead of refusing to exist.
	empty: boolean
	files: number
	approvedFiles: number
	totalChanges: number
	decidedChanges: number
	openQuestions: number
	openRequests: number
	agentListening: boolean
	agentActivity: AgentActivity | null
	queuedQuestions: number
	queuedReviews: number
	openedAt: string
	lastActivityAt: string
	// Desk page path (/d/<id>/), relative so valid behind any origin.
	path: string
}

export type HubHealth = {
	ok: true
	version: string
	startedAt: string
	desks: number
	keyRequired: boolean
	// Changes on every hub start; consumers compare it to detect a restart.
	instanceId: string
}

// POST /api/hub/desks: open a desk (or reuse the live one per repo+session, re-diffing it).
// root: absolute or ~-prefixed, inside the repo on the hub's machine; target: file or ref/PR; path narrows a repo diff; guide is JSON the hub validates.
export type OpenDeskRequest = {
	root: string
	mode?: ReviewMode | undefined
	session?: string | undefined
	target?: string | undefined
	base?: string | undefined
	staged?: boolean | undefined
	path?: string | undefined
	guide?: unknown
	// A repo or pr desk reviewed without a guide on purpose; otherwise such a desk expects one and says so until it is attached.
	noGuide?: boolean | undefined
}

// created: a new desk; reloaded: the live desk for that repo+session reused and re-diffed (its open tab updates by itself).
export type OpenDeskOutcome = 'created' | 'reloaded'

export type OpenDeskResponse = {
	ok: true
	desk: DeskSummary
	outcome: OpenDeskOutcome
}

export type HubDesksResponse = { desks: DeskSummary[] }

export type CloseDeskResponse = { ok: true; closed: boolean; id: string }

// ── The hub journal ───────────────────────────────────────────────────────────────────────
// What happened on the hub, in order: the record the dashboard's activity, history and numbers
// read. The hub appends an event when the thing happens (never derived later from desk state),
// keeps the journal under ~/.syneva/hub/ across restarts, and serves its tail. Counts are the
// ones true at that moment; a desk's later state never rewrites an event.

// Who and what an event is about: the desk, named as the listing names it, so an event outlives
// its desk (a closed desk's history still reads).
export type HubEventSubject = {
	// Monotonic across the journal, never reused: a reader asks for what follows the last it holds.
	seq: number
	at: string
	deskId: string
	projectId: string
	project: string
	root: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
}

// The size of a desk's review when the event happened.
export type HubEventScope = {
	files: number
	totalChanges: number
}

export type HubEvent =
	// A new desk (an open that reused the live desk is a reload, below).
	| (HubEventSubject & HubEventScope & { kind: 'desk-opened' })
	// The agent re-diffed the desk: `syneva reload`, or an open that reused the live desk.
	| (HubEventSubject & HubEventScope & { kind: 'desk-reloaded' })
	// The reviewer's Send: one round of verdicts, as the ReviewResult counted them. `round` is
	// 1-based per desk (its sends in the journal, this one included).
	| (HubEventSubject &
			HubEventScope & {
				kind: 'round-sent'
				round: number
				accepted: number
				rejected: number
				requestedChanges: number
				openQuestions: number
				approvedFiles: number
			})
	// An agent received a round (its await delivered the review).
	| (HubEventSubject & { kind: 'round-picked'; round: number })
	// The reviewer asked the agent (Ask): `questions` in this ask.
	| (HubEventSubject & { kind: 'question-asked'; questions: number })
	// The agent posted into the desk (`syneva comment`): an answer or a note.
	| (HubEventSubject & { kind: 'agent-replied' })
	// The desk left the hub, with how far its review had come and the open parameters its subject
	// does not name: the PR base and the repo-mode path limit (absolute), as the desk was opened.
	// A reopen posts them back, so it rebuilds the same review rather than a wider one.
	| (HubEventSubject &
			HubEventScope & {
				kind: 'desk-closed'
				approvedFiles: number
				decidedChanges: number
				base?: string | undefined
				pathFilter?: string | undefined
			})

// GET /api/hub/journal[?after=<seq>][&limit=<n>]: the events after `after` (all of the kept
// tail without it), oldest first, at most `limit` (the newest ones when more follow). `latest`
// is the newest seq the hub holds (0 for an empty journal): a reader that polls asks for what
// follows it.
export type HubJournalResponse = {
	events: HubEvent[]
	latest: number
}
