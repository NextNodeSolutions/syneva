// The backend domain mirrors these shapes but cannot import contracts - keep both sides in sync.

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
	// Line at creation; reload re-anchors when edits shift the line (reanchorComments).
	anchorText?: string | undefined
	// Re-anchoring failed (line gone/ambiguous): shown in a file-level strip, not on a row.
	unanchored?: boolean | undefined
	// 'file': whole-file comment (lineNumber 0 + 'additions' placeholders; real lines are 1-based), derived from lineNumber.
	anchor?: 'file' | undefined
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
	// Uncommitted tracked-file modifications only (repo mode; file mode when tracked); PR mode and untracked are verdict-only.
	stageable?: boolean | undefined
	contentHash?: string | undefined
	// contentHash at decision time; a mismatch on reload drops the record as stale.
	reviewedHash?: string | undefined
	// Rendered-diff position: @pierre renumbers per render, derived per render (syncDisplayAnchors), never persisted; raw lineNumber/endLine stay canonical.
	displayLineNumber?: number | undefined
	displayEndLine?: number | undefined
}

// Decision record is the source of truth, not git staging: survives a reload even when
// accepting staged the hunk out of the diff.
export type Decision = {
	key: string
	status: 'accepted' | 'rejected'
	// contentHash at decision time; a mismatch on reload drops the decision as stale.
	reviewedHash?: string | undefined
	path: string
	lineNumber: number
	side: 'additions' | 'deletions'
	title: string
}

// order drives Next/Prev; category is the Walkthrough section (semantic, not the folder). Normalized on attach (validateGuide): the desk's stored shape, not what agents write.
export type GuideFile = {
	path: string
	order: number
	category: string
}

// review: decisions + sign-off, notes kept; approved: signed-off files only; all also clears notes (and the default for a bodyless POST).
export type ResetScope = 'review' | 'approved' | 'all'

// Review grouping attached with --guide; absent = files in diff order and every guide surface off. A grouping only - no agent prose.
export type Guide = {
	files: GuideFile[]
	// Diff the grouping was generated against; a reload advancing past it marks it out of date.
	baseDiffHash?: string | undefined
}
