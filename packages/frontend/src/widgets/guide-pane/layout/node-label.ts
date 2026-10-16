// A node's label as drawn: wrapped on words to its box's width, so a long label (the guide allows 120 characters) grows the box downward instead of running past it onto its neighbours or out of the drawing. SVG text cannot wrap or be measured before layout, so the width is estimated like an edge label's: 5.8px a character is a generous average for the node's 11px sans (about 5.2px measured on a sentence).
const CHAR_WIDTH = 5.8
// Both sides together: 8px left and right, 8px over and under.
const PADDING_INLINE = 16
const PADDING_BLOCK = 16
export const LINE_HEIGHT = 13
// Room kept on every line for a linked node's arrow, so a node wraps the same whether its reference resolves or not, and the layout (which does not know) sizes it right.
const ARROW_CHARS = 2

function chunks(word: string, size: number): string[] {
	const parts: string[] = []
	for (let start = 0; start < word.length; start += size)
		parts.push(word.slice(start, start + size))
	return parts
}

// Words fill a line until the next would overflow it; a word longer than a whole line is cut.
export function nodeLines(label: string, boxWidth: number): string[] {
	const perLine = Math.max(
		1,
		Math.floor((boxWidth - PADDING_INLINE) / CHAR_WIDTH) - ARROW_CHARS,
	)
	const words = label
		.split(/\s+/u)
		.filter(Boolean)
		.flatMap(word => chunks(word, perLine))
	const lines: string[] = []
	let line = ''
	for (const word of words) {
		if (line && line.length + 1 + word.length > perLine) {
			lines.push(line)
			line = word
		} else line = line ? `${line} ${word}` : word
	}
	return [...lines, line]
}

// One height for every node of a diagram, the tallest wrapped label's (never under the shape's own), so the rows and lanes stay aligned.
export function nodeHeight(
	labels: readonly string[],
	boxWidth: number,
	minHeight: number,
): number {
	return Math.max(
		minHeight,
		...labels.map(
			label =>
				nodeLines(label, boxWidth).length * LINE_HEIGHT + PADDING_BLOCK,
		),
	)
}
