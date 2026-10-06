// The hub's wire shapes - protocol DTOs only. A neutral dependency sink like the rest of
// packages/contracts/src: imports only the shared review records, no backend/frontend
// modules, no platform API.
//
// The hub is the one long-running Syneva process on a host: it hosts every desk (one review
// of one repo + session) and serves the dashboard over them. The dashboard and the agent CLI
// both read desks through these shapes, so they can never disagree about what a desk is.
import type { AgentActivity } from './browser.js'
import type { ReviewMode } from './review.js'

// One desk as the hub lists it: identity, what it reviews, how far the review is, and the
// transient agent liveness the desk itself reports. Counts are derived from the desk's live
// state at request time - never persisted.
export type DeskSummary = {
	// Stable per repo+session (see deskId in the backend's domain/identity): the same desk
	// keeps the same id - and the same /d/<id>/ URL - across hub restarts.
	id: string
	root: string
	// The repo's directory name - the dashboard's project label; `root` disambiguates.
	project: string
	// Stable per repo root (a digest of it, like the desk id): the dashboard's project page is
	// keyed on it (projectPagePath), so two repos sharing a directory name never share a page.
	projectId: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
	baseDiffHash: string
	// True when the desk currently reviews nothing (a clean tree, a branch at its base): the
	// desk waits for the agent's next reload rather than refusing to exist.
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
	// The desk page path on the hub (/d/<id>/) - relative, so it is valid behind any origin.
	path: string
}

export type HubHealth = {
	ok: true
	version: string
	// Changes on every hub start; a tab or an agent compares it to detect a restart.
	instanceId: string
	startedAt: string
	desks: number
	// True when the hub only answers callers carrying the access key (hosted mode).
	keyRequired: boolean
}

// POST /api/hub/desks: open a desk (or reuse the live one for the same repo+session, reloading
// its diff). `root` is any absolute path (or one from `~`) inside the repo on the hub's machine
// - a relative one is refused, the hub's cwd being no one's; `path` narrows a repo-mode diff;
// `target` is the file (file mode, resolved against `root` when relative) or the ref/PR (pr
// mode); `guide` is a raw guide JSON value the hub validates.
export type OpenDeskRequest = {
	root: string
	mode?: ReviewMode | undefined
	session?: string | undefined
	target?: string | undefined
	base?: string | undefined
	staged?: boolean | undefined
	path?: string | undefined
	guide?: unknown
}

// `created` - a new desk; `reloaded` - the live desk for that repo+session was reused and its
// diff rebuilt (the open tab updates by itself).
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
	// The desk left the hub, with how far its review had come.
	| (HubEventSubject &
			HubEventScope & {
				kind: 'desk-closed'
				approvedFiles: number
				decidedChanges: number
			})

// GET /api/hub/journal[?after=<seq>][&limit=<n>]: the events after `after` (all of the kept
// tail without it), oldest first, at most `limit` (the newest ones when more follow). `latest`
// is the newest seq the hub holds (0 for an empty journal): a reader that polls asks for what
// follows it.
export type HubJournalResponse = {
	events: HubEvent[]
	latest: number
}
