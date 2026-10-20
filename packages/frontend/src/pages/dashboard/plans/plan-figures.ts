import { decodeBlock } from '@entities/review/guide/decode-blocks'

import type { ExplanationBlock } from '@entities/review/guide/model'

export type FigureBlock = Extract<
	ExplanationBlock,
	{ kind: 'state' | 'sequence' | 'flow' }
>

export type PlanFigure =
	| { ok: true; block: FigureBlock; source: string }
	| { ok: false; reason: string; source: string }

// A fence opens with three or more backticks or tildes (at most three spaces in), and closes
// on the same character, at least as long, with nothing after it but spaces.
const FENCE_OPEN = /^ {0,3}(?<marker>`{3,}|~{3,})\s*(?<info>[^\s`]*)/
const FIGURE_LANGUAGE = 'syneva'

const FENCE_CLOSE = /^ {0,3}(?<run>`{3,}|~{3,})\s*$/

function closes(line: string, marker: string): boolean {
	const run = FENCE_CLOSE.exec(line)?.groups?.run ?? ''
	return run.startsWith(marker.charAt(0)) && run.length >= marker.length
}

function edgesOf(block: FigureBlock): { from: string; to: string }[] {
	if (block.kind === 'state') return block.transitions
	if (block.kind === 'sequence') return block.steps
	return block.edges
}

function idsOf(block: FigureBlock): Set<string> {
	if (block.kind === 'state')
		return new Set(block.states.map(node => node.id))
	if (block.kind === 'sequence')
		return new Set(block.participants.map(node => node.id))
	return new Set(block.nodes.map(node => node.id))
}

// What the drawing cannot place: an edge naming a node the figure does not declare.
function unplaced(block: FigureBlock): string | null {
	const ids = idsOf(block)
	const stray = edgesOf(block)
		.flatMap(edge => [edge.from, edge.to])
		.find(id => !ids.has(id))
	if (!stray) return null
	return `"${stray}" is not one of its nodes`
}

function decodeFigure(json: unknown, index: number): FigureBlock | string {
	const raw =
		typeof json === 'object' && json !== null && !Array.isArray(json)
			? { id: `figure-${String(index)}`, ...json }
			: json
	const block = decodeBlock(raw, { endpoint: 'plan figure' })
	if (block.kind === 'prose' || block.kind === 'before-after')
		return 'its kind must be state, sequence or flow'
	return unplaced(block) ?? block
}

// A figure is one diagram block in the guide's JSON shape. Anything else is shown as its source
// under a notice naming the problem: a figure never keeps the page from reading.
export function parseFigure(source: string, index: number): PlanFigure {
	try {
		const decoded = decodeFigure(JSON.parse(source), index)
		if (typeof decoded === 'string')
			return { ok: false, reason: decoded, source }
		return { ok: true, block: decoded, source }
	} catch (error) {
		const reason =
			error instanceof Error ? error.message : 'it does not read'
		return { ok: false, reason, source }
	}
}

type Run =
	| { kind: 'prose'; lines: string[] }
	| { kind: 'figure'; source: string }

// The line closing the fence `marker` opens at `from`, or the body's end for one left open.
function closingLine(
	lines: readonly string[],
	from: number,
	marker: string,
): number {
	for (let at = from + 1; at < lines.length; at += 1)
		if (closes(lines[at] ?? '', marker)) return at
	return lines.length
}

// The body's lines as runs of prose and figure fences. Every other fence stays in the prose,
// whole: a `syneva` fence quoted inside a longer one is its text, not a figure.
function runsOf(lines: readonly string[]): Run[] {
	const runs: Run[] = []
	let prose: string[] = []
	let index = 0
	while (index < lines.length) {
		const open = FENCE_OPEN.exec(lines[index] ?? '')?.groups
		const last = open ? closingLine(lines, index, open.marker ?? '') : index
		if (open?.info === FIGURE_LANGUAGE) {
			runs.push({ kind: 'prose', lines: prose })
			runs.push({
				kind: 'figure',
				source: lines.slice(index + 1, last).join('\n'),
			})
			prose = []
		} else prose.push(...lines.slice(index, last + 1))
		index = last + 1
	}
	runs.push({ kind: 'prose', lines: prose })
	return runs
}

export type MarkedFigure = { marker: string; figure: PlanFigure }

export type MarkedBody = { markdown: string; figures: MarkedFigure[] }

// The plan's body with each figure fence replaced by a marker paragraph of its own, so the
// whole body renders in one pass (its footnotes and link references reach across figures) and
// the rendered prose is cut at the markers. A marker sits at the margin between blank lines,
// so it always renders as a top-level paragraph, and is a word the body never holds.
export function markFigures(markdown: string): MarkedBody {
	let salt = 0
	while (markdown.includes(`synevafigure${String(salt)}x`)) salt += 1
	const figures: MarkedFigure[] = []
	const lines: string[] = []
	for (const run of runsOf(markdown.split('\n'))) {
		if (run.kind === 'prose') {
			lines.push(...run.lines)
			continue
		}
		const number = figures.length + 1
		const marker = `synevafigure${String(salt)}x${String(number)}`
		figures.push({ marker, figure: parseFigure(run.source, number) })
		lines.push('', marker, '')
	}
	return { markdown: lines.join('\n'), figures }
}
