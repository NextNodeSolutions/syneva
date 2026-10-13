// The line arithmetic of a parsed script: offsets to 1-based lines, what each line holds, and the identifiers a subtree references.
import type { LineKind } from '../../../domain/outline.js'

type Span = { start: number; end: number }

export type LineIndex = {
	readonly lineOf: (offset: number) => number
	readonly lines: readonly string[]
	readonly starts: readonly number[]
}

export function lineIndex(text: string): LineIndex {
	const lines = text.split('\n')
	const starts: number[] = []
	let offset = 0
	for (const line of lines) {
		starts.push(offset)
		offset += line.length + 1
	}
	// The last line starting at or before the offset (binary search over the line starts).
	const lineOf = (target: number): number => {
		let low = 0
		let high = starts.length - 1
		while (low < high) {
			const middle = (low + high + 1) >> 1
			if ((starts[middle] ?? 0) <= target) low = middle
			else high = middle - 1
		}
		return low + 1
	}
	return { lineOf, lines, starts }
}

// The lines a span reaches, first to last.
function linesOf(index: LineIndex, span: Span): number[] {
	const first = index.lineOf(span.start)
	const last = index.lineOf(Math.max(span.start, span.end - 1))
	return Array.from(
		{ length: last - first + 1 },
		(_, offset) => first + offset,
	)
}

// A comment covers a line when the line's visible text lies inside it; one comment can cover several lines.
function commentLines(
	index: LineIndex,
	comments: readonly Span[],
): Set<number> {
	return new Set(
		comments.flatMap(comment =>
			linesOf(index, comment).filter(line =>
				isInside(index, line, comment),
			),
		),
	)
}

function isInside(index: LineIndex, line: number, span: Span): boolean {
	const text = index.lines[line - 1] ?? ''
	const start = index.starts[line - 1] ?? 0
	const visibleStart = start + text.length - text.trimStart().length
	const visibleEnd = start + text.trimEnd().length
	return span.start <= visibleStart && visibleEnd <= span.end
}

export function lineKinds(
	index: LineIndex,
	imports: readonly Span[],
	comments: readonly Span[],
): string {
	const importLines = new Set(
		imports.flatMap(statement => linesOf(index, statement)),
	)
	const covered = commentLines(index, comments)
	return index.lines
		.map((text, position): LineKind => {
			const line = position + 1
			if (!text.trim()) return 'b'
			if (importLines.has(line)) return 'i'
			return covered.has(line) ? 'c' : 'x'
		})
		.join('')
}

type AstNode = { type: string }

function isAstNode(candidate: unknown): candidate is AstNode {
	return (
		typeof candidate === 'object' &&
		candidate !== null &&
		'type' in candidate &&
		typeof candidate.type === 'string'
	)
}

function childNodes(node: AstNode): AstNode[] {
	return Object.values<unknown>(node).flatMap(field =>
		Array.isArray(field)
			? field.filter(isAstNode)
			: [field].filter(isAstNode),
	)
}

const IDENTIFIER_TYPES = new Set(['Identifier', 'JSXIdentifier'])

// Every identifier name the subtree spells, deduplicated: references, bindings and JSX tags alike (the links read only the names that match a declaration or an import).
export function identifiersIn(root: unknown): string[] {
	if (!isAstNode(root)) return []
	const names = new Set<string>()
	const pending: AstNode[] = [root]
	for (let node = pending.pop(); node; node = pending.pop()) {
		if (
			IDENTIFIER_TYPES.has(node.type) &&
			'name' in node &&
			typeof node.name === 'string'
		)
			names.add(node.name)
		pending.push(...childNodes(node))
	}
	return [...names]
}
