// A changed block cut at the declarations it crosses. Git cuts a block as one run of removed and added lines whatever code the run spans: the tail of one function and the head of the next, two functions added in a row, a whole deleted file. The desk reads and decides by declaration (the brick), so such a block is cut into one block per declaration its lines sit in - the narrowest one, a method before its class - and its removed lines follow the declaration they stood in on the old side, matched to the new side by name. Lines in no declaration make a block of their own when they are imports or comments (what the hub names a block by when it has no code) and join the block after them, or before them at the end, when they are blank or plain statements.
import type { OutlineDeclaration, SourceOutline } from '../outline.js'
import type { DiffLine } from '../review.js'

export type SideOutlines = {
	readonly additions: SourceOutline | null
	readonly deletions: SourceOutline | null
}

// A run of lines and the declaration (or trivia) it belongs to; a run without a key joins a neighbour.
type Run = { key: string | null; lines: DiffLine[] }
type Group = { key: string; lines: DiffLine[] }

function lineOf(line: DiffLine): number {
	return (line.kind === 'add' ? line.newLine : line.oldLine) ?? 0
}

function spanOf(declaration: OutlineDeclaration): number {
	return declaration.endLine - declaration.startLine
}

// The narrowest declaration holding the line, as the key both sides are matched by.
function holderKey(outline: SourceOutline, line: number): string | null {
	const [holder] = outline.declarations
		.filter(
			declaration =>
				declaration.startLine <= line && line <= declaration.endLine,
		)
		.toSorted((a, b) => spanOf(a) - spanOf(b))
	if (!holder) return null
	return `${holder.kind}:${holder.name}`
}

function kindsOf(
	outline: SourceOutline,
	lines: readonly DiffLine[],
): Set<string> {
	return new Set(
		lines.map(line => outline.lineKinds[lineOf(line) - 1] ?? 'x'),
	)
}

// A run outside every declaration stands on its own when it is imports or comments; blank lines and plain statements have no block of their own.
function triviaKey(
	outline: SourceOutline,
	lines: readonly DiffLine[],
): string | null {
	const kinds = kindsOf(outline, lines)
	if (kinds.has('x')) return null
	if (kinds.has('i')) return 'trivia:import'
	if (kinds.has('c')) return 'trivia:comment'
	return null
}

function isBlank(outline: SourceOutline, lines: readonly DiffLine[]): boolean {
	return [...kindsOf(outline, lines)].every(kind => kind === 'b')
}

function keyOf(outline: SourceOutline, run: Run): string | null {
	if (run.key === null) return triviaKey(outline, run.lines)
	if (isBlank(outline, run.lines)) return null
	return run.key
}

function runs(outline: SourceOutline, lines: readonly DiffLine[]): Run[] {
	const cut: Run[] = []
	for (const line of lines) {
		const key = holderKey(outline, lineOf(line))
		const last = cut.at(-1)
		if (last?.key === key) last.lines.push(line)
		else cut.push({ key, lines: [line] })
	}
	return cut.map(run => ({ key: keyOf(outline, run), lines: run.lines }))
}

// A keyless run joins the run after it; a trailing one joins the run before it.
function merged(cut: readonly Run[]): Group[] {
	const groups: Group[] = []
	let pending: DiffLine[] = []
	for (const run of cut) {
		if (run.key === null) {
			pending.push(...run.lines)
			continue
		}
		groups.push({ key: run.key, lines: [...pending, ...run.lines] })
		pending = []
	}
	const last = groups.at(-1)
	if (pending.length && last) last.lines.push(...pending)
	else if (pending.length) groups.push({ key: '', lines: pending })
	return groups
}

function grouped(outline: SourceOutline, lines: readonly DiffLine[]): Group[] {
	return merged(runs(outline, lines))
}

// Each run of removed lines goes to the block of the declaration it stood in, found on the new side past the last match (both sides read in order); a run with no such declaration - its code gone, or renamed - stays with the block before it.
function distributed(
	dels: readonly DiffLine[],
	groups: readonly Group[],
	outline: SourceOutline | null,
): DiffLine[][] {
	const slots: DiffLine[][] = groups.map(() => [])
	if (!dels.length) return slots
	if (!outline) {
		slots[0]?.push(...dels)
		return slots
	}
	let cursor = 0
	for (const run of grouped(outline, dels)) {
		const found = groups.findIndex(
			(group, index) => index >= cursor && group.key === run.key,
		)
		if (found >= 0) cursor = found
		slots[cursor]?.push(...run.lines)
	}
	return slots
}

// The block's pieces, each its removed lines then its added ones as git orders a block; the block itself, alone, when it sits in one declaration or its side has no outline.
export function splitBlock(
	block: readonly DiffLine[],
	outlines: SideOutlines,
): DiffLine[][] {
	const adds = block.filter(line => line.kind === 'add')
	const dels = block.filter(line => line.kind === 'delete')
	const side = adds.length ? 'additions' : 'deletions'
	const outline = outlines[side]
	if (!outline) return [[...block]]
	const groups = grouped(outline, side === 'additions' ? adds : dels)
	if (!groups[1]) return [[...block]]
	if (side === 'deletions') return groups.map(group => group.lines)
	const removed = distributed(dels, groups, outlines.deletions)
	return groups.map((group, index) =>
		(removed[index] ?? []).concat(group.lines),
	)
}
