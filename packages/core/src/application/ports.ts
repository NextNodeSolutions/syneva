// The narrow readonly capability objects the use cases consume: use cases never import concrete outbound adapters (composition roots + inbound adapters wire these), and every member exists because a use case calls it.
// Timestamps/ids are NOT ported - application reads them directly (time.ts) and passes values into the pure domain functions.

import type { JournalEvent } from '../domain/hub-journal.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { SourceOutline } from '../domain/outline.js'
import type { PlanRecord } from '../domain/plan.js'
import type { ReviewState } from '../domain/review.js'

// The filesystem facet implemented by the same adapter object as GitPort's workspace: application never imports node:fs and use-case signatures stay git-shaped.
export interface WorkspacePort {
	readonly realpath: (path: string) => Promise<string | null>
	readonly isDirectory: (path: string) => Promise<boolean>
	readonly readFile: (path: string) => Promise<string | null>
	// The raw bytes, for a file served as is (/blob's images); null when it cannot be read.
	readonly readBytes: (
		path: string,
	) => Promise<Uint8Array<ArrayBuffer> | null>
	// Staging's `git apply` needs a file argument (must share the tree's filesystem).
	readonly writeTempFile: (contents: string) => Promise<string>
	readonly removeTempDir: (dir: string) => Promise<void>
}

// Reads a source file's outline (declarations, imports, line kinds) for the languages it knows; null for any other file or one that does not parse. Pure over its input: the caller caches by content.
export interface ParserPort {
	readonly outline: (path: string, text: string) => SourceOutline | null
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
	// Many objects in one git process (`cat-file --batch`), keyed by the spec asked for (`<rev>:<path>`, `:0:<path>`); a missing object is simply absent.
	readonly readObjects: (
		root: string,
		specs: readonly string[],
	) => Promise<Map<string, string>>
	readonly getGitRoot: (cwd: string) => Promise<string>
	readonly getHead: (cwd: string) => Promise<string | null>
	// The branch at cwd ("" when HEAD is unresolvable): the CLI's default session name.
	readonly getBranch: (cwd: string) => Promise<string>
	readonly projectTree: (root: string) => Promise<string[]>
	// One `gh` invocation, only to resolve a PR number/URL; rejects when gh is missing or unauthenticated (callers report, never crash).
	readonly gh: (args: string[], cwd: string) => Promise<string>
	readonly workspace: WorkspacePort
	// The parser rides along like the workspace: the diff builders already hold this capability, and naming the code they diff needs no other port threaded through every build.
	readonly parser: ParserPort
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

// The plan library (~/.syneva/hub/plans/<id>/): each plan's record and every version verbatim.
// `load` reads every record that decodes (domain/plan) - a malformed one is skipped, a missing
// library is an empty one. A version's text is written before the record that names it, so a
// record never points at a version that is not on disk.
export interface PlanStorePort {
	readonly load: () => Promise<PlanRecord[]>
	readonly save: (record: PlanRecord) => Promise<void>
	readonly writeVersion: (
		id: string,
		version: number,
		markdown: string,
	) => Promise<void>
	// null when the plan or the version is not on disk.
	readonly readVersion: (
		id: string,
		version: number,
	) => Promise<string | null>
}
