// The patch that stages one block: git's own, or one piece of it when the hub cut the block at declarations (block-split.ts) - its removed and added lines cut back out of the git block they sit in. Git applies a hunk where its first lines match near the line its header names; a hunk with nothing to match lands on that line, which is only right while nothing above it is unstaged. So a block that only adds carries the lines it follows as context, and git finds the place by content wherever the index stands.
import { blockCounts } from '../change-blocks.js'

import { changeBlocks, findChangeCandidate, parseStableKey } from './change.js'
import { parseUnifiedDiff } from './parse.js'

import type { ChangeState, DiffFile, DiffHunk, DiffLine } from '../review.js'

// The lines git matches to place a block that only adds: enough for the place to be the one meant, few enough to stand in a small hunk.
const ANCHOR_LINES = 3

export type StageContext = {
	// The file's blocks as the desk lists them and the keys already staged: what a block that only adds is placed after.
	readonly changes: readonly ChangeState[]
	readonly stagedKeys: readonly string[]
}

type Located = { hunk: DiffHunk; block: readonly DiffLine[] }

type Slice = Located & { dels: DiffLine[]; adds: DiffLine[] }

type Placed = { slice: Slice; anchor: DiffLine[] }

function ownLine(line: DiffLine): number {
	return (line.kind === 'add' ? line.newLine : line.oldLine) ?? 0
}

function within(line: number, start: number, count: number): boolean {
	return line >= start && line < start + count
}

function sideLines(
	block: readonly DiffLine[],
	side: ChangeState['side'],
): DiffLine[] {
	const kind = side === 'additions' ? 'add' : 'delete'
	return block.filter(line => line.kind === kind)
}

function holdsLine(located: Located, change: ChangeState): boolean {
	const own = sideLines(located.block, change.side)
	const [first] = own
	const last = own.at(-1)
	return (
		!!first &&
		!!last &&
		ownLine(first) <= change.lineNumber &&
		change.lineNumber <= ownLine(last)
	)
}

// The git block holding the change's first line on its side.
function blockHolding(
	file: DiffFile,
	change: ChangeState,
): Located | undefined {
	return file.hunks
		.flatMap(hunk => changeBlocks(hunk).map(block => ({ hunk, block })))
		.find(located => holdsLine(located, change))
}

// The change's own lines out of the git block: the key spells their counts, the change their first line on each side (the removed ones from where the cut put them, else from the block's start). A miscount is a key the block no longer matches.
function sliceOf(located: Located, change: ChangeState): Slice | undefined {
	const { removed, added } = blockCounts(change)
	const blockDels = sideLines(located.block, 'deletions')
	const removedLine =
		change.side === 'deletions'
			? change.lineNumber
			: (change.removedLine ?? blockDels[0]?.oldLine ?? 0)
	const dels = blockDels.filter(line =>
		within(line.oldLine ?? 0, removedLine, removed),
	)
	const adds =
		change.side === 'additions'
			? sideLines(located.block, 'additions').filter(line =>
					within(line.newLine ?? 0, change.lineNumber, added),
				)
			: []
	if (dels.length !== removed || adds.length !== added) return undefined
	return { ...located, dels, adds }
}

// The unchanged lines right above the block in its hunk: always in the index, whatever is staged.
function contextAbove(located: Located): DiffLine[] {
	const [first] = located.block
	const above: DiffLine[] = []
	const from = first ? located.hunk.lines.indexOf(first) : 0
	for (let index = from - 1; index >= 0; index--) {
		const line = located.hunk.lines[index]
		if (line?.kind !== 'context') break
		above.unshift(line)
	}
	return above
}

function tail(lines: readonly DiffLine[]): DiffLine[] {
	return lines.slice(-ANCHOR_LINES)
}

function siblingsAbove(
	slice: Slice,
	change: ChangeState,
	context: StageContext | undefined,
): ChangeState[] {
	const blockAdds = sideLines(slice.block, 'additions')
	return (context?.changes ?? [])
		.filter(
			sibling =>
				sibling.path === change.path &&
				sibling.side === 'additions' &&
				sibling.lineNumber < change.lineNumber &&
				blockAdds.some(line => line.newLine === sibling.lineNumber),
		)
		.toSorted((a, b) => b.lineNumber - a.lineNumber)
}

// The sibling's lines that stand in the index: its added lines once staged, its removed lines until then; none for an unstaged sibling that only adds.
function standingLines(
	slice: Slice,
	sibling: ChangeState,
	context: StageContext | undefined,
): DiffLine[] {
	const { removed, added } = blockCounts(sibling)
	if (context?.stagedKeys.includes(`${sibling.path}:${sibling.stableKey}`))
		return sideLines(slice.block, 'additions').filter(line =>
			within(line.newLine ?? 0, sibling.lineNumber, added),
		)
	const blockDels = sideLines(slice.block, 'deletions')
	const from = sibling.removedLine ?? blockDels[0]?.oldLine ?? 0
	return blockDels.filter(line => within(line.oldLine ?? 0, from, removed))
}

// What a block that only adds is placed after: the nearest block above it in the same git block that stands in the index - staged, so its added lines are there; unstaged with removed lines, still there - else the unchanged lines above the git block. Every sibling is placed the same way, so the added lines come out in the file's order whatever order they are staged in.
function anchorFor(
	slice: Slice,
	change: ChangeState,
	context: StageContext | undefined,
): DiffLine[] {
	if (slice.dels.length) return []
	for (const sibling of siblingsAbove(slice, change, context)) {
		const standing = standingLines(slice, sibling, context)
		if (standing.length) return tail(standing)
	}
	return tail(contextAbove(slice))
}

function formatRange(start: number, count: number): string {
	return count === 1 ? String(start) : `${start},${count}`
}

// The header's starts are git's hint for where to look: the anchor's own numbers (a line the index has on one side only lends its number to the other), else the block's, else the line before it.
function oldStartOf(slice: Slice, lead: DiffLine | undefined): number {
	const previous = contextAbove(slice).at(-1)
	return (
		lead?.oldLine ??
		lead?.newLine ??
		slice.dels[0]?.oldLine ??
		previous?.oldLine ??
		Math.max(0, (slice.adds[0]?.newLine ?? slice.hunk.newStart) - 1)
	)
}

function newStartOf(slice: Slice, lead: DiffLine | undefined): number {
	const previous = contextAbove(slice).at(-1)
	return (
		lead?.newLine ??
		lead?.oldLine ??
		slice.adds[0]?.newLine ??
		previous?.newLine ??
		Math.max(0, (slice.dels[0]?.oldLine ?? slice.hunk.oldStart) - 1)
	)
}

function renderPatch(filePath: string, placed: Placed): string {
	const { slice, anchor } = placed
	const [lead] = anchor
	const oldStart = oldStartOf(slice, lead)
	const newStart = newStartOf(slice, lead)
	const oldCount = anchor.length + slice.dels.length
	const newCount = anchor.length + slice.adds.length
	return [
		`diff --git a/${filePath} b/${filePath}`,
		`--- a/${filePath}`,
		`+++ b/${filePath}`,
		`@@ -${formatRange(oldStart, oldCount)} +${formatRange(newStart, newCount)} @@`,
		...anchor.map(line => ` ${line.text}`),
		...slice.dels.map(line => `-${line.text}`),
		...slice.adds.map(line => `+${line.text}`),
		'',
	].join('\n')
}

function ownPlace(
	file: DiffFile,
	change: ChangeState,
	context: StageContext | undefined,
): Placed | undefined {
	const located = blockHolding(file, change)
	const slice = located && sliceOf(located, change)
	return slice && { slice, anchor: anchorFor(slice, change, context) }
}

// Git's block nearest to a key the desk no longer lists (a verdict staged after a reload re-cut the file), whole, placed after the unchanged lines above it when it only adds.
function nearestPlace(file: DiffFile, stableKey: string): Placed | undefined {
	const match = findChangeCandidate(
		file,
		stableKey,
		parseStableKey(stableKey),
	)
	if (!match) return undefined
	const slice = {
		hunk: match.hunk,
		block: match.block,
		dels: sideLines(match.block, 'deletions'),
		adds: sideLines(match.block, 'additions'),
	}
	return { slice, anchor: slice.dels.length ? [] : tail(contextAbove(slice)) }
}

export function stagePatch(
	rawDiff: string,
	filePath: string,
	stableKey: string,
	context?: StageContext,
): string {
	const file = parseUnifiedDiff(rawDiff).find(
		candidate => (candidate.newPath ?? candidate.oldPath) === filePath,
	)
	if (!file) throw new Error(`No diff found for ${filePath}`)
	const change = context?.changes.find(
		candidate => candidate.stableKey === stableKey,
	)
	const placed =
		(change && ownPlace(file, change, context)) ??
		nearestPlace(file, stableKey)
	if (!placed)
		throw new Error(`No matching change found for ${filePath}:${stableKey}`)
	return renderPatch(filePath, placed)
}
