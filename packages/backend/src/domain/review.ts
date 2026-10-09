// The persisted/derived review shapes - never imported into packages/contracts: the browser sees only its allowlisted projection there.
// Records are immutable (reload/reconciliation REPLACE them, never edit), so fields are readonly; application mutations copy-on-write; the diff parser assembles incrementally before publish.
// ReviewComment/ChangeState/Decision structurally mirror packages/contracts/review.ts (domain may not import contracts) - keep both sides in sync; the guide's mirror is guide-shapes.ts.

import type { Guide } from './guide-shapes.js'

export type ReviewMode = 'repo' | 'file' | 'pr'

export type Writable<T> = { -readonly [K in keyof T]: T[K] }

// Build-time counterpart: parser/DTO decoders assemble incrementally before publish; these stay private to the building module and widen into the readonly published shapes by plain assignment.
export type WritableDeep<T> = T extends readonly (infer U)[]
	? WritableDeep<U>[]
	: T extends object
		? { -readonly [K in keyof T]: WritableDeep<T[K]> }
		: T

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
	// Stamped by the UI's own projection (syncDisplayAnchors), never on this record.
	readonly displayLineNumber?: number | undefined
	readonly displayEndLine?: number | undefined
}

export type Decision = {
	readonly key: string // `${path}:${stableKey}`
	readonly status: 'accepted' | 'rejected'
	readonly reviewedHash?: string | undefined
	readonly path: string
	readonly lineNumber: number
	readonly side: 'additions' | 'deletions'
	readonly title: string
}

export type ReviewFile = DiffFile & {
	readonly path: string
	// File-level staleness key: git blob OID for a committed new side, blobOid hash for a working-tree side; changes iff content changes, so approval goes stale on content change (reviewedFileHashes).
	// NOT the block key: ChangeState.contentHash hashes a content slice (a diff block is not a git object).
	readonly contentHash: string
	// Change class from the diff's paths alone; the builder stamps it so file contents never ride the state (fetched per file via /file-contents).
	readonly changeKind?:
		| 'added'
		| 'modified'
		| 'deleted'
		| 'renamed'
		| undefined
	// A hunk-less full-file add counts its whole contents as additions.
	added?: number | undefined
	removed?: number | undefined
	// A byte-identical move (zero-hunk git rename or plain-mv untracked pair): drives the muted "renamed · no changes" row without contents.
	readonly renamePure?: boolean | undefined
	// New-side byte size, stamped ONLY in working/file mode (sizes are not in git diff --raw); oversized checks fall back to diff-text length + changed-line counts.
	size?: number | undefined
	// Set when a rendered diff would freeze the tab: the UI shows a verdict-capable summary card instead ("Load diff anyway" escape; isOversized in application/diff-files.ts).
	// Omitted (not false) on ordinary files, so the state stays lean and the UI reads it as plain truthiness.
	readonly oversized?: boolean | undefined
}

export type ReviewState = {
	readonly id: string
	readonly session: string
	readonly root: string
	readonly repoHash: string
	readonly mode: ReviewMode
	readonly target?: string | undefined
	readonly base?: string | undefined
	readonly staged: boolean
	readonly head: string | null
	readonly baseDiffHash: string
	readonly createdAt: string
	readonly updatedAt?: string | undefined
	readonly rawDiff: string
	readonly files: readonly ReviewFile[]
	readonly comments: readonly ReviewComment[]
	readonly changes: readonly ChangeState[]
	// Sign-offs (Approve button); approved-vs-changes-requested is DERIVED from objections, never stored; reviewedFileHashes pins the contentHash at sign-off.
	readonly reviewedFiles: readonly string[]
	readonly reviewedFileHashes?: Readonly<Record<string, string>> | undefined
	readonly stagedFiles: readonly string[]
	readonly stagedChangeKeys?: readonly string[] | undefined
	readonly decisionFiles?: readonly string[] | undefined
	readonly decisions?: readonly Decision[] | undefined
	readonly guide?: Guide | undefined
	readonly persistFile?: string | undefined
}
