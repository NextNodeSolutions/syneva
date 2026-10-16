import type { ChangeSymbol, ChangeTrivia } from './outline.js'
import type { ChangeState, DiffFile } from './review.js'

// The new path, or the old one for a full deletion, or a placeholder for a malformed section that carries neither (the UI shows it but no mode can read its sides).
export function filePathOf(file: DiffFile): string {
	return file.newPath ?? file.oldPath ?? 'unknown'
}

// The decision key, and the id the UI groups it by: `${path}:${stableKey}`.
export function changeKey(change: ChangeState): string {
	return `${change.path}:${change.stableKey}`
}

// A stable key carries the block's counts (side:line:dels:adds); read them here so a title and an inventory never parse it apart.
const STABLE_KEY = /^(additions|deletions):(\d+):(\d+):(\d+)$/
const REMOVED_GROUP = 3
const ADDED_GROUP = 4

export type BlockCounts = { removed: number; added: number }

export function blockCounts(
	change: Pick<ChangeState, 'stableKey'>,
): BlockCounts {
	const counts: (string | undefined)[] =
		change.stableKey?.match(STABLE_KEY) ?? []
	return {
		removed: Number(counts[REMOVED_GROUP] ?? 0),
		added: Number(counts[ADDED_GROUP] ?? 0),
	}
}

const TRIVIA_LABELS: Record<ChangeTrivia, string> = {
	comment: 'comments',
	import: 'imports',
}

// What a verdict, a blocker row and the agent's review name the block by: the code it sits in when there is one, then its size.
export function changeTitle(
	counts: BlockCounts,
	naming: {
		symbol?: ChangeSymbol | undefined
		trivia?: ChangeTrivia | undefined
	} = {},
): string {
	const size = `${counts.removed} removed · ${counts.added} added`
	const trivia = naming.trivia ? TRIVIA_LABELS[naming.trivia] : undefined
	const parts = [naming.symbol?.name, trivia, size].filter(Boolean)
	return parts.join(' · ')
}
