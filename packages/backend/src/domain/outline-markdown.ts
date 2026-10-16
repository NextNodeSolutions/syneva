// A Markdown file's outline: its ATX headings as nested sections, so a changed paragraph is named by the section it sits in. Pure string work - no parser dependency for prose.
import type { OutlineDeclaration, SourceOutline } from './outline.js'

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const FENCE = /^\s*(`{3,}|~{3,})(.*)$/

type Heading = { level: number; title: string; line: number }

// The opening fence a line closes or opens, or what was open before. As in CommonMark, only a fence of the same character, at least as long and with nothing after it, closes the open one: a four-backtick example can hold a three-backtick sample whose "#" lines stay code.
function fenceAfter(open: string | null, text: string): string | null {
	const [, marker, rest] = FENCE.exec(text) ?? []
	if (!marker) return open
	if (!open) return marker
	const isClosing =
		marker[0] === open[0] && marker.length >= open.length && !rest?.trim()
	if (isClosing) return null
	return open
}

function headingsOf(lines: readonly string[]): Heading[] {
	const headings: Heading[] = []
	let fence: string | null = null
	for (const [index, text] of lines.entries()) {
		const wasFenced = fence !== null
		fence = fenceAfter(fence, text)
		if (wasFenced || fence) continue
		const [, hashes, title] = HEADING.exec(text) ?? []
		if (hashes && title)
			headings.push({ level: hashes.length, title, line: index + 1 })
	}
	return headings
}

// A section runs to the line before the next heading of its level or above, or to the end of the file.
function sectionEnd(
	headings: readonly Heading[],
	index: number,
	lastLine: number,
): number {
	const heading = headings[index]
	if (!heading) return lastLine
	const next = headings
		.slice(index + 1)
		.find(candidate => candidate.level <= heading.level)
	return next ? next.line - 1 : lastLine
}

export function markdownOutline(text: string): SourceOutline {
	const lines = text.split('\n')
	const headings = headingsOf(lines)
	const declarations: OutlineDeclaration[] = headings.map(
		(heading, index) => ({
			name: heading.title,
			kind: 'section',
			startLine: heading.line,
			endLine: sectionEnd(headings, index, lines.length),
			isExported: false,
			uses: [],
		}),
	)
	return {
		declarations,
		imports: [],
		lineKinds: lines.map(line => (line.trim() ? 'x' : 'b')).join(''),
	}
}
