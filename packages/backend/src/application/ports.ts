// The narrow readonly capability objects the use cases consume: use cases never import concrete outbound adapters (composition roots + inbound adapters wire these), and every member exists because a use case calls it.
// Timestamps/ids are NOT ported - application reads them directly (time.ts) and passes values into the pure domain functions.

import type { JournalEvent } from '../domain/hub-journal.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { ReviewState } from '../domain/review.js'

// The filesystem facet implemented by the same adapter object as GitPort's workspace: application never imports node:fs and use-case signatures stay git-shaped.
export interface WorkspacePort {
	readonly realpath: (path: string) => Promise<string | null>
	readonly isDirectory: (path: string) => Promise<boolean>
	readonly readFile: (path: string) => Promise<string | null>
	// Staging's `git apply` needs a file argument (must share the tree's filesystem).
	readonly writeTempFile: (contents: string) => Promise<string>
	readonly removeTempDir: (dir: string) => Promise<void>
}

// The git surface the diff builders, content resolution and staging flows drive.
export interface GitPort {
	// One git invocation with quotePath=false; trimmed stdout.
	readonly run: (args: string[], cwd: string) => Promise<string>
	// One file at a ref or the working tree; a missing side degrades to "" unless `strict`.
	readonly fileAt: (
		root: string,
		rel: string | undefined,
		ref?: string,
		strict?: boolean,
	) => Promise<string>
	readonly rawBlobOids: (
		root: string,
		query: {
			staged?: boolean | undefined
			base?: string | undefined
			head?: string | undefined
			path?: string | undefined
		},
	) => Promise<Map<string, string>>
	readonly getGitRoot: (cwd: string) => Promise<string>
	readonly getHead: (cwd: string) => Promise<string | null>
	// The branch at cwd ("" when HEAD is unresolvable): the CLI's default session name.
	readonly getBranch: (cwd: string) => Promise<string>
	readonly projectTree: (root: string) => Promise<string[]>
	// One `gh` invocation, only to resolve a PR number/URL; rejects when gh is missing or unauthenticated (callers report, never crash).
	readonly gh: (args: string[], cwd: string) => Promise<string>
	readonly workspace: WorkspacePort
}

// Load the newest saved review for a session, persist the live state, and write auxiliary artifacts (the Send result) atomically.
export interface ReviewStorePort {
	readonly loadLatestReview: (
		root: string,
		session: string,
	) => Promise<ReviewState | null>
	readonly persistReview: (state: ReviewState) => Promise<PersistedReview>
	readonly writeFileAtomic: (file: string, contents: string) => Promise<void>
}

// When the file was written and its name: the next save overwrites the same file.
export type ReviewStamp = { updatedAt: string; persistFile: string }

export type PersistedReview = { file: string; stamp: ReviewStamp }

// The global reviewer preferences (~/.syneva/settings.json) for the open-editor template and the desk's Settings dialog.
export interface SettingsPort {
	readonly read: () => Promise<Record<string, unknown>>
	readonly write: (settings: unknown) => Promise<void>
}

// Launch the reviewer's configured editor for one repo file; codes are the desk's editor failure contract: EDITOR_NOT_ALLOWED/BAD_EDITOR_COMMAND answer 422, EDITOR_FAILED answers 500.
export type EditorLaunch =
	| { ok: true }
	| { ok: false; code: string; message: string }

export interface EditorPort {
	readonly open: (
		root: string,
		file: string,
		line: unknown,
	) => Promise<EditorLaunch>
}

// The new-version check a hub start runs before binding (an offer may re-exec the CLI).
export interface UpdateCheckPort {
	readonly maybeOfferUpdate: () => Promise<void>
}

// The hub's desk registry (~/.syneva/hub/desks.json): every desk's rebuild parameters, written on open/close so a restart reopens the same desks on the same ids; decoded field by field (domain/hub-registry).
export interface HubRegistryPort {
	readonly load: () => Promise<HubDeskRecord[]>
	readonly save: (records: readonly HubDeskRecord[]) => Promise<void>
}

// The hub journal (~/.syneva/hub/journal.jsonl): what happened on the hub, one event per line,
// appended as it happens. `load` reads every event the file holds, oldest first, decoded line by
// line (domain/hub-journal) - a malformed line is skipped, a missing file is an empty journal.
// `rewrite` replaces the whole file atomically: the compaction of a file that outgrew the tail
// the hub keeps.
export interface HubJournalPort {
	readonly load: () => Promise<JournalEvent[]>
	readonly append: (event: JournalEvent) => Promise<void>
	readonly rewrite: (events: readonly JournalEvent[]) => Promise<void>
}
