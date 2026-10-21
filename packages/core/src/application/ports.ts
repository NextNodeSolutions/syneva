// The narrow readonly capability objects the use cases consume: use cases never import concrete outbound adapters (composition roots + inbound adapters wire these), and every member exists because a use case calls it.
// Timestamps/ids are NOT ported - application reads them directly (time.ts) and passes values into the pure domain functions.

import type { JournalEvent } from '../domain/hub-journal.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { SourceOutline } from '../domain/outline.js'
import type { PlanRecord } from '../domain/plan.js'
import type { ReviewState } from '../domain/review.js'

// The filesystem facet GitPort carries as its workspace: application never imports node:fs and use-case signatures stay git-shaped.
export interface WorkspacePort {
	readonly realpath: (path: string) => Promise<string | null>
	readonly isDirectory: (path: string) => Promise<boolean>
	readonly readFile: (path: string) => Promise<string | null>
	// The raw bytes, for a file served as is (/blob's images); null when it cannot be read.
	readonly readBytes: (
		path: string,
	) => Promise<Uint8Array<ArrayBuffer> | null>
}

// Reads a source file's outline (declarations, imports, line kinds) for the languages it knows; null for any other file or one that does not parse. Pure over its input: the caller caches by content.
export interface ParserPort {
	readonly outline: (path: string, text: string) => SourceOutline | null
}

// The git surface every desk reads, sized to what GitHub's REST API serves for a repository named
// by owner/name and two refs (RFC 0001, 3.2): a pr desk on base..head needs nothing beyond it.
// One member per operation, named for what it means, never a command line: locally each runs the
// git command named on it with quotePath=false (paths come back as raw UTF-8); the web call that
// will serve it follows "web:". `root` names the repository (locally the clone's top level), a
// `ref` a commit-ish. What only a clone on disk can do rides beside it as optional capabilities
// the application checks for: `workingTree` (the working tree, the index, the remotes) and
// `staging` (writing the index); a PR number or URL resolves through PullRequestPort.
export interface GitPort {
	// The repository's root for a path inside it (`git rev-parse --show-toplevel`); rejects outside
	// one. web: the repository the desk names.
	readonly getGitRoot: (cwd: string) => Promise<string>
	// The commit HEAD names (`git rev-parse HEAD`); null when unresolvable (no commit yet). web: the
	// desk's head (`GET /repos/{o}/{r}/commits/{ref}`).
	readonly getHead: (cwd: string) => Promise<string | null>
	// The branch at cwd ("" when HEAD is unresolvable): the CLI's default session name (`git
	// rev-parse --abbrev-ref HEAD`, `detached-<short sha>` off a branch). web: the head branch.
	readonly getBranch: (cwd: string) => Promise<string>
	// The branch a pr desk without --base diffs against: origin/HEAD's target (`git symbolic-ref
	// --short refs/remotes/origin/HEAD`, e.g. "origin/main"), else the first of main/master that
	// `git rev-parse --verify` finds, else HEAD. web: `default_branch` (`GET /repos/{o}/{r}`).
	readonly defaultBranch: (root: string) => Promise<string>
	// The best common ancestor of two revisions (`git merge-base <a> <b>`); rejects when there is
	// none. web: `merge_base_commit` (`GET /repos/{o}/{r}/compare/{a}...{b}`).
	readonly mergeBase: (root: string, a: string, b: string) => Promise<string>
	// The commit a revision names (`git rev-parse --verify --quiet <ref>^{commit}`); null when it
	// names none. web: `GET /repos/{o}/{r}/commits/{ref}`, a 404/422 is null.
	readonly resolveRef: (root: string, ref: string) => Promise<string | null>
	// The unified diff between two commits (`git diff --no-ext-diff -M <base>..<head>`); -M asks
	// git itself to pair renames, whatever the user's `diff.renames` config. web: the compare API
	// in the diff media type (`GET /repos/{o}/{r}/compare/{base}...{head}`).
	readonly diff: (
		root: string,
		range: { base: string; head: string },
	) => Promise<string>
	// The new side's blob id per new path over the same range, read in one go instead of a blob per
	// file (`git diff --no-ext-diff -M --raw -z --no-abbrev <base>..<head>`); empty when it cannot
	// be read. web: the compare API's `files[].sha`.
	readonly rawBlobOids: (
		root: string,
		range: { base: string; head: string },
	) => Promise<Map<string, string>>
	// One file at a commit (`git show <ref>:<rel>`); a missing side degrades to "" unless `strict`.
	// web: the contents API (`GET /repos/{o}/{r}/contents/{rel}?ref=`, raw media type).
	readonly fileAt: (
		root: string,
		rel: string | undefined,
		ref: string,
		strict?: boolean,
	) => Promise<string>
	// Many files at commits in one go (`git cat-file --batch`), keyed by the `<rev>:<path>` spec
	// asked for; a missing object is simply absent. web: the contents API per spec.
	readonly readObjects: (
		root: string,
		specs: readonly string[],
	) => Promise<Map<string, string>>
	// Every file path at a commit, sorted (`git ls-tree -r --name-only <ref>`); [] when unreadable:
	// the project tree of a desk without a working tree. web: `GET
	// /repos/{o}/{r}/git/trees/{ref}?recursive=1`.
	readonly tree: (root: string, ref: string) => Promise<string[]>
	// The files under the repository, by absolute path. web: the head's contents.
	readonly workspace: WorkspacePort
	// The parser rides along like the workspace: the diff builders already hold this capability, and naming the code they diff needs no other port threaded through every build.
	readonly parser: ParserPort
	// The clone on disk; absent on a hub whose desks read a branch (the web).
	readonly workingTree?: WorkingTreePort | undefined
	// Writing the index; absent where there is no index to write.
	readonly staging?: StagingPort | undefined
}

// The clone on disk beyond its commits: its working tree, its index and its remotes. Repo and file
// desks read through it (rootProblem refuses them on a hub without one); a pr open checks the tree
// is clean, refreshes origin's base and moves HEAD with it; the staged snapshot reads the index -
// a hub without one has nothing staged.
export interface WorkingTreePort {
	// The working diff (`git diff --no-ext-diff -M [--cached] [-- <path>]`): the working tree
	// against the index, or with `staged` the index against HEAD.
	readonly diff: (
		root: string,
		scope: { staged?: boolean | undefined; path?: string | undefined },
	) => Promise<string>
	// The index side's blob id per new path of the staged diff (`git diff --no-ext-diff -M --raw -z
	// --no-abbrev --cached [-- <path>]`); empty when it cannot be read.
	readonly stagedBlobOids: (
		root: string,
		path: string | undefined,
	) => Promise<Map<string, string>>
	// One file as the index holds it (`git show :0:<rel>`); "" when absent unless `strict`.
	readonly indexFile: (
		root: string,
		rel: string | undefined,
		strict?: boolean,
	) => Promise<string>
	// One file as the working tree holds it, read from disk; "" when absent.
	readonly workingFile: (
		root: string,
		rel: string | undefined,
	) => Promise<string>
	// GitPort.readObjects with the index: `:0:<path>` specs beside `<rev>:<path>` ones, in the same
	// one `git cat-file --batch` (a staged desk reads HEAD and the index together).
	readonly readObjects: (
		root: string,
		specs: readonly string[],
	) => Promise<Map<string, string>>
	// Whether the index tracks a path (`git ls-files --error-unmatch -- <rel>`).
	readonly isTracked: (root: string, rel: string) => Promise<boolean>
	// The files the index tracks, sorted (`git ls-files`); [] when unreadable.
	readonly projectTree: (root: string) => Promise<string[]>
	// The untracked files git does not ignore (`git ls-files --others --exclude-standard [-- <path>]`).
	readonly untrackedFiles: (
		root: string,
		path: string | undefined,
	) => Promise<string[]>
	// The paths the index changes against HEAD (`git diff --cached --name-only`).
	readonly stagedPaths: (root: string) => Promise<string[]>
	// The tracked files with uncommitted changes as `git status --porcelain --untracked-files=no`
	// lists them ("" when clean).
	readonly trackedChanges: (root: string) => Promise<string>
	// origin's copy of a branch, refreshed: `git fetch origin <name>` (best effort), then
	// `origin/<name>` when `git rev-parse --verify --quiet` resolves it, else null.
	readonly remoteBranch: (
		root: string,
		name: string,
	) => Promise<string | null>
	// Move HEAD to a branch (`git checkout <name>`).
	readonly checkout: (root: string, name: string) => Promise<void>
}

// Writing the index: what a desk's Approve and hunk staging do to the clone. The Decision records
// stay the truth (AGENTS.md), so a desk without it loses no verdict: its staging routes answer
// STAGING_DISABLED and a reset drops only the review's own records.
export interface StagingPort {
	// Stage whole paths (`git add -- <paths>`): both halves of a move record it as a rename.
	readonly stage: (root: string, paths: readonly string[]) => Promise<void>
	// Return paths to HEAD in the index (`git restore --staged -- <paths>`, else `git reset HEAD
	// -- <paths>`: a branch with no commit yet has no restore target).
	readonly unstage: (root: string, paths: readonly string[]) => Promise<void>
	// Apply one block's patch to the index: 'skipped' when the index already holds it (`git apply
	// --cached --unidiff-zero --reverse --check`), else 'applied' (`git apply --cached
	// --unidiff-zero`); rejects when it does not apply. The patch travels through a temp file the
	// adapter owns (git apply takes a file on the tree's filesystem).
	readonly applyToIndex: (
		root: string,
		patch: string,
	) => Promise<'applied' | 'skipped'>
}

// A pull request as a hub resolves it: its head and base branches by name, and the head commit its
// diff is read at - readable through GitPort once resolved.
export type PullRequest = {
	headBranch: string
	baseBranch: string
	head: string
}

// Pull requests by number or URL, where the hub can reach the forge: what `gh` does locally, the
// pulls API on the web (`GET /repos/{owner}/{repo}/pulls/{number}`: head.ref, base.ref, head.sha).
// Optional in the hub's io: without it a PR ref is refused as a reason and a branch still opens.
// Both reject with the sentence an open reports (gh missing or unauthenticated, no such PR).
export interface PullRequestPort {
	// Locally `gh pr view <ref> --json headRefName,baseRefName,url`, then the head fetched into the
	// clone and pinned by its sha, so no later fetch moves the diff: `git fetch <remote>
	// refs/pull/<n>/head` from the remote of the PR's own repository (in a fork's clone origin is
	// the fork), then `git rev-parse FETCH_HEAD`.
	readonly resolve: (root: string, ref: string) => Promise<PullRequest>
	// Move HEAD to the PR's head branch, tracking a fork's (`gh pr checkout <ref>`), once an open
	// is admitted; asked only of a hub with a working tree (the web has no HEAD to move).
	readonly checkout: (root: string, ref: string) => Promise<void>
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

// Launch the reviewer's configured editor for one repo file; codes are the desk's editor failure contract: EDITOR_NOT_ALLOWED/BAD_EDITOR_COMMAND/EDITOR_LOCAL_ONLY answer 422, EDITOR_FAILED answers 500.
export type EditorLaunch =
	| { ok: true }
	| { ok: false; code: string; message: string }

// Whether the OS's own opener may stand in for an editor (an empty setting falls back to it;
// `open` and `xdg-open` name it). It hands the file to the system's file associations, which run
// an executable, a script or an app bundle as itself: given a file the web chose, it would run a
// program the web chose. So only the machine's own requests may use it (EDITOR_LOCAL_ONLY
// otherwise), and a relayed request gets an editor the machine's settings name, or nothing.
export type EditorScope = { osOpener: boolean }

export interface EditorPort {
	readonly open: (
		root: string,
		file: string,
		line: unknown,
		scope: EditorScope,
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
