// The review's inventory: the changed units an agent's guide must own and the fingerprint its source stamp must carry. Pure over the review state (mirror of packages/contracts/src/inventory.ts).
import { changeKey } from './change-blocks.js'
import { hash } from './identity.js'

import type { ChangeState, ReviewFile, ReviewState } from './review.js'

export const INVENTORY_FORMAT = 'syneva-inventory/1'

export type InventoryUnit = {
	readonly key: string
	readonly path: string
	readonly side: 'additions' | 'deletions'
	readonly lineNumber: number
	readonly endLine: number
	readonly removed: number
	readonly added: number
	readonly contentHash: string
	readonly title: string
}

export type InventoryFile = {
	readonly path: string
	readonly oldPath?: string | undefined
	readonly newPath?: string | undefined
	readonly changeKind: 'added' | 'modified' | 'deleted' | 'renamed'
	readonly contentHash: string
	readonly hasHunks: boolean
	readonly renamePure: boolean
	readonly added: number
	readonly removed: number
}

export type ReviewInventory = {
	readonly format: typeof INVENTORY_FORMAT
	readonly mode: ReviewState['mode']
	readonly root: string
	readonly session: string
	readonly head: string | null
	readonly base?: string | undefined
	readonly staged: boolean
	readonly path?: string | undefined
	readonly fingerprint: string
	readonly files: InventoryFile[]
	readonly units: InventoryUnit[]
	readonly fileUnits: string[]
}

// A stable key has the block's counts (side:line:dels:adds); the inventory spells the span out so an agent never parses it.
const STABLE_KEY = /^(additions|deletions):(\d+):(\d+):(\d+)$/
const REMOVED_GROUP = 3
const ADDED_GROUP = 4

function unitOf(change: ChangeState): InventoryUnit {
	const counts: (string | undefined)[] =
		change.stableKey?.match(STABLE_KEY) ?? []
	const removed = Number(counts[REMOVED_GROUP] ?? 0)
	const added = Number(counts[ADDED_GROUP] ?? 0)
	const span = change.side === 'additions' ? added : removed
	return {
		key: changeKey(change),
		path: change.path,
		side: change.side,
		lineNumber: change.lineNumber,
		endLine: change.endLine ?? change.lineNumber + Math.max(span, 1) - 1,
		removed,
		added,
		contentHash: change.contentHash ?? '',
		title: change.title,
	}
}

function fileOf(file: ReviewFile): InventoryFile {
	return {
		path: file.path,
		oldPath: file.oldPath,
		newPath: file.newPath,
		changeKind: file.changeKind ?? 'modified',
		contentHash: file.contentHash,
		hasHunks: file.hunks.length > 0,
		renamePure: file.renamePure ?? false,
		added: file.added ?? 0,
		removed: file.removed ?? 0,
	}
}

// Equal when the same files hold the same content and the same blocks changed the same way; a comment moving a block keeps the block's hash, a rewrite does not.
export function sourceFingerprint(
	state: Pick<ReviewState, 'mode' | 'staged' | 'files' | 'changes'>,
	pathFilter: string | undefined,
): string {
	return hash(
		JSON.stringify([
			state.mode,
			state.staged,
			pathFilter ?? '',
			state.files.map(file => [
				file.path,
				file.changeKind ?? '',
				file.contentHash,
			]),
			state.changes.map(change => [
				changeKey(change),
				change.contentHash ?? '',
			]),
		]),
	)
}

export function buildInventory(
	state: ReviewState,
	pathFilter: string | undefined,
): ReviewInventory {
	const files = state.files.map(fileOf)
	return {
		format: INVENTORY_FORMAT,
		mode: state.mode,
		root: state.root,
		session: state.session,
		head: state.head,
		base: state.base,
		staged: state.staged,
		path: pathFilter,
		fingerprint: sourceFingerprint(state, pathFilter),
		files,
		units: state.changes.map(unitOf),
		fileUnits: files.filter(file => !file.hasHunks).map(file => file.path),
	}
}
