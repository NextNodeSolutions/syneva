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
