// The read-only inventory of a review source: what an agent authors a guide against, before any desk opens.
// `syneva inventory` prints it; a guide's source.fingerprint must be this inventory's, so references are never read against another revision.
import type { ReviewMode } from './review.js'

export const INVENTORY_FORMAT = 'syneva-inventory/1'

// One changed text block: the unit a domain owns and a decision records (`key` is the decision key, path:stableKey).
export type InventoryUnit = {
	key: string
	path: string
	side: 'additions' | 'deletions'
	// Original-side lines of the block (the new file for additions, the old one for deletions), 1-based, inclusive.
	lineNumber: number
	endLine: number
	removed: number
	added: number
	// The block's content identity: a rewrite changes it, a move does not.
	contentHash: string
	title: string
}

export type InventoryFile = {
	path: string
	oldPath?: string | undefined
	newPath?: string | undefined
	changeKind: 'added' | 'modified' | 'deleted' | 'renamed'
	contentHash: string
	// False for a file operation without text blocks (a pure rename, an untracked addition): owned with a `file` member.
	hasHunks: boolean
	renamePure: boolean
	added: number
	removed: number
}

export type ReviewInventory = {
	format: typeof INVENTORY_FORMAT
	mode: ReviewMode
	root: string
	session: string
	head: string | null
	base?: string | undefined
	staged: boolean
	path?: string | undefined
	// Hash of the mode, source and every file's and unit's content identity: equal fingerprints are the same review.
	fingerprint: string
	files: InventoryFile[]
	units: InventoryUnit[]
	// Paths that need a `file` member: the files without text blocks.
	fileUnits: string[]
}
