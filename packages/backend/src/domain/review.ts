// The backend's persisted/derived review shapes. Domain owns these: they are the
// persistence format and the diff-derived records the pure rules (decisions,
// re-anchoring, guide validation) operate on. They must NOT enter
// packages/contracts/src - the browser only sees the allowlisted projection there.
//
// The shared wire records (ReviewMode, ReviewComment, ChangeState, Decision,
// Guide, GuideFile) are declared below as structural mirrors of
// packages/contracts/src/review.ts - domain may not import contracts, and TypeScript's
// structural typing keeps the two sides interchangeable. Keep the mirrored
// shapes in structural sync when editing either side.
//
// The comment/change/decision/guide records are immutable domain data: reload and
// reconciliation REPLACE them (new objects) rather than editing fields in place, so
// their fields are readonly. The whole ReviewState is likewise immutable as far as the
// desk is concerned: application mutations are copy-on-write - they build a NEW state
// root with structural sharing (only changed branches replaced; no deep clone/freeze) -
// and the diff parser builds files/hunks/lines incrementally during construction, before
// the state becomes a desk's published root.

export type ReviewMode = 'repo' | 'file' | 'pr'

export type Writable<T> = { -readonly [K in keyof T]: T[K] }

// The mutable build-time counterpart of the published records below. The parser and the
// persistence DTO decoders assemble files/hunks/lines incrementally (pushing into arrays)
// BEFORE the state becomes a desk's published root; these intermediates stay private to the
// building module and are widened into the readonly published shapes by plain assignment
// (mutable arrays/objects are assignable to their readonly counterparts).
export type WritableDeep<T> = T extends readonly (infer U)[]
	? WritableDeep<U>[]
	: T extends object
		? { -readonly [K in keyof T]: WritableDeep<T[K]> }
		: T

// Optional props are explicitly `T | undefined` (not bare `?`): these shapes are
// JSON-round-tripped DTOs assembled in memory with explicit undefined keys, and the
// repo checks under exactOptionalPropertyTypes. Keep in sync with contracts/review.ts.
export type DiffLine = {
	readonly kind: 'context' | 'add' | 'delete'
	readonly text: string
	readonly oldLine?: number | undefined
	readonly newLine?: number | undefined
	readonly diffPosition: number
	readonly hunkHeader: string
}

export type DiffHunk = {
	readonly header: string
	readonly oldStart: number
	readonly oldCount: number
	readonly newStart: number
	readonly newCount: number
	readonly lines: readonly DiffLine[]
}

export type DiffFile = {
	readonly oldPath?: string | undefined
	readonly newPath?: string | undefined
	readonly hunks: readonly DiffHunk[]
}

// Structural mirror of packages/contracts/src/review.ts (ReviewComment). Keep in sync.
export type ReviewComment = {
	readonly id: string
	readonly path: string
	readonly side: 'additions' | 'deletions'
	readonly lineNumber: number
	readonly endLine?: number | undefined
	readonly body: string
	readonly createdAt: string
	readonly updatedAt: string
	readonly status: 'open' | 'resolved' | 'stale'
	readonly intent?: 'note' | 'action' | 'question' | undefined
	readonly role?: 'user' | 'agent' | undefined
	readonly anchorText?: string | undefined
	readonly unanchored?: boolean | undefined
	readonly anchor?: 'file' | undefined
}

// Structural mirror of packages/contracts/src/review.ts (ChangeState). Keep in sync.
export type ChangeState = {
	readonly id: string
	readonly path: string
	readonly hunkIndex: number
	readonly changeIndex?: number | undefined
	readonly side: 'additions' | 'deletions'
	readonly lineNumber: number
	readonly endLine?: number | undefined
	readonly title: string
	readonly stableKey?: string | undefined
	readonly status: 'pending' | 'accepted' | 'rejected'
	readonly stageable?: boolean | undefined
	readonly contentHash?: string | undefined
	readonly reviewedHash?: string | undefined
	// Display anchors are stamped by the UI on its own mutable projection
	// (syncDisplayAnchors), never on this record - see contracts/review.ts.
	readonly displayLineNumber?: number | undefined
	readonly displayEndLine?: number | undefined
}

// Structural mirror of packages/contracts/src/review.ts (Decision). Keep in sync.
export type Decision = {
	readonly key: string // `${path}:${stableKey}`
	readonly status: 'accepted' | 'rejected'
	readonly reviewedHash?: string | undefined
	readonly path: string
	readonly lineNumber: number
	readonly side: 'additions' | 'deletions'
	readonly title: string
}

// Structural mirror of packages/contracts/src/review.ts (GuideFile / Guide). Keep in sync.
export type GuideFile = {
	readonly path: string
	readonly order: number
	readonly category: string
}

export type Guide = {
	readonly files: GuideFile[]
	readonly baseDiffHash?: string | undefined
}

export type ReviewFile = DiffFile & {
	readonly path: string
	// Git blob OID of the new-side contents - the file-level staleness key. Changes iff the
	// content changes, so a file's approval invalidates when its content changes between turns
	// (see reviewedFileHashes / mergeReviewState). Harvested from `git diff --raw` for a committed
	// new side; hashed locally (blobOid) for a working-tree side. NOT the block-level key:
	// ChangeState.contentHash stays a content-slice hash (a diff block is not a git object).
	readonly contentHash: string
	// Lean metadata stamped by the builder (issue 04) so file contents never ride the state - the
	// tab fetches them per file via GET /api/file-contents. Derived from the diff structure + the
	// bytes read to hash a working side; never require re-reading a committed blob.
	//
	// Change class, from the diff's paths (no contents): added (--- /dev/null), deleted (+++
	// /dev/null), renamed (distinct old/new paths), else modified.
	readonly changeKind?:
		| 'added'
		| 'modified'
		| 'deleted'
		| 'renamed'
		| undefined
	// +added / -removed line counts. From the parsed hunks; a hunk-less full-file add counts its
	// whole content as additions (matching what the UI used to derive from the embedded contents).
	added?: number | undefined
	removed?: number | undefined
	// A byte-identical move (distinct paths, unchanged content): git-native zero-hunk rename or a
	// plain-`mv` untracked pair. NOT pure. Drives the UI's muted "renamed · no changes" row /
	// Renamed-fold without contents.
	readonly renamePure?: boolean | undefined
	// New-side byte size, stamped ONLY in working/file mode (free from the bytes read to hash the
	// working copy). OMITTED for committed new sides (pr/staged) - sizes aren't in `git diff --raw`
	// and a batched lookup wasn't worth a slice dominated by deletion. Issue 05's oversized-file
	// threshold falls back to diff-text length + changed-line counts where size is absent.
	size?: number | undefined
	// Set (issue 05) when this file's diff is big enough to freeze the tab if rendered - the UI shows
	// a verdict-capable summary card instead of the diff (with a "Load diff anyway" escape hatch).
	// Stamped by the builder from the diff alone (text length + changed lines, plus `size` where it's
	// present); see isOversized in backend/application/diff-files.ts. Omitted (not `false`) on
	// ordinary files, so the state
	// stays lean and the UI reads it as a plain truthiness check.
	readonly oversized?: boolean | undefined
}

export type ReviewState = {
	readonly id: string
	// Stable identity of the review: repo + session (branch by default).
	readonly session: string
	readonly root: string
	readonly repoHash: string
	// How this review was built - drives staging semantics, result wording, and
	// how `reload` rebuilds the diff.
	readonly mode: ReviewMode
	// Rebuild params: file path (file mode) or branch/ref (pr mode), and the pr base.
	readonly target?: string | undefined
	readonly base?: string | undefined
	readonly staged: boolean
	readonly head: string | null
	// Hash of the raw diff this review was built against (staleness metadata).
	readonly baseDiffHash: string
	readonly createdAt: string
	readonly updatedAt?: string | undefined
	readonly rawDiff: string
	readonly files: readonly ReviewFile[]
	readonly comments: readonly ReviewComment[]
	readonly changes: readonly ChangeState[]
	// Files the reviewer has finished/signed off (set by the Approve / Mark reviewed button).
	// The displayed status (approved vs changes-requested) is *derived* from objections, not
	// stored here. reviewedFileHashes records the file's contentHash at sign-off so approval
	// goes stale when the file's content changes.
	readonly reviewedFiles: readonly string[]
	readonly reviewedFileHashes?: Readonly<Record<string, string>> | undefined
	readonly stagedFiles: readonly string[]
	readonly stagedChangeKeys?: readonly string[] | undefined
	readonly decisionFiles?: readonly string[] | undefined
	// Explicit accept/reject records - the source of truth for decisions.
	readonly decisions?: readonly Decision[] | undefined
	// Agent-supplied file grouping (order + category sections); it carries no prose.
	// Optional: absent → no guide surfaces render.
	readonly guide?: Guide | undefined
	readonly persistFile?: string | undefined
}
