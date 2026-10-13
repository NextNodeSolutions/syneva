// A Markdown file's outline: its ATX headings as nested sections, so a changed paragraph is named by the section it sits in. Pure string work - no parser dependency for prose.
import type { OutlineDeclaration, SourceOutline } from './outline.js'

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const FENCE = /^\s*(```|~~~)/

type Heading = { level: number; title: string; line: number }

function headingsOf(lines: readonly string[]): Heading[] {
	const headings: Heading[] = []
	let isFenced = false
	for (const [index, text] of lines.entries()) {
		if (FENCE.test(text)) isFenced = !isFenced
		if (isFenced) continue
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
