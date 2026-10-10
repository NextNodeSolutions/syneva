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

// Feedback on the guide rather than on a line: a note, question or change request on a domain, or on one of its explanation blocks. Its anchor is the domain's (and block's) stable id under the guide it was written against, plus the code the target pointed at then, so the thread stays readable after a guide replacement drops or changes the target - it is never re-pointed by title or position.
export type DomainCodeRef = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	endLine?: number | undefined
	label?: string | undefined
}

export type DomainTarget = {
	guideFingerprint: string
	domainId: string
	blockId?: string | undefined
	domainTitle: string
	blockTitle?: string | undefined
	refs: DomainCodeRef[]
}

export type DomainComment = {
	id: string
	target: DomainTarget
	body: string
	createdAt: string
	updatedAt: string
	status: 'open' | 'resolved' | 'stale'
	intent?: 'note' | 'action' | 'question' | undefined
	role?: 'user' | 'agent' | undefined
	// The attached guide no longer has the target (a replacement dropped the domain or the block): the thread keeps the context above and is marked, never moved.
	unanchored?: boolean | undefined
}

// review: decisions + sign-off, notes kept; approved: signed-off files only; all also clears notes (and the default for a bodyless POST).
export type ResetScope = 'review' | 'approved' | 'all'
