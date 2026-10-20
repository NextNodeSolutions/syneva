import { esc } from '@shared/lib/esc'

// A plan's front matter (title, summary) is the record's, read by the hub: the page shows it
// in its head, so the body starts after it.
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/

export function planBody(markdown: string): string {
	return markdown.replace(FRONT_MATTER, '')
}

// A section as the page lays it out: its number for the eyebrow and the table of contents,
// its heading without the number the author may have written into it.
export type PlanSection = { id: string; number: string; title: string }

// Each part keyed by its place in its section, which is what it is while the reading lasts; a
// figure carries its source, parsed where it is drawn (plan-figure.tsx), and its number across
// the body for the caption.
export type ReadPart =
	| { key: string; kind: 'html'; html: string }
	| { key: string; kind: 'figure'; source: string; number: number }

// The heading's rendered inline markup (code, a link, a footnote reference) is kept for the
// band's headline; the table of contents reads its text.
export type ReadSection = PlanSection & { html: string; parts: ReadPart[] }

// What comes before the first section, then the sections.
export type PlanReading = { intro: ReadPart[]; sections: ReadSection[] }

const WRITTEN_NUMBER = /^(?<number>\d+)[.)]? +/
const NUMBER_WIDTH = 2

// The rendered nodes before the first section, then each section's heading and its nodes.
type Chunk = { heading: Element | null; nodes: ChildNode[] }

// A first h1 that only repeats the plan's title is dropped, since the page's head states it.
function dropTitle(body: HTMLElement, title: string): void {
	const first = body.firstElementChild
	if (first?.tagName === 'H1' && first.textContent.trim() === title.trim())
		first.remove()
}

// The rendered body cut at each top-level h2: the page draws every section as a band of its
// own, under its own heading. Cutting the rendered DOM, not the markdown, leaves a `## ` inside
// a fence or a quote where it is.
function chunksOf(body: HTMLElement): Chunk[] {
	const chunks: Chunk[] = [{ heading: null, nodes: [] }]
	for (const node of body.childNodes) {
		if (node instanceof HTMLHeadingElement && node.tagName === 'H2')
			chunks.push({ heading: node, nodes: [] })
		else chunks.at(-1)?.nodes.push(node)
	}
	return chunks
}

// A number the author wrote at the head of a heading is the section's own only when it is its
// place: "2026 roadmap" keeps its year, and a heading numbered out of order keeps its number
// in its title rather than giving two sections the same eyebrow.
function dropWrittenNumber(heading: Element, position: number): void {
	const first = heading.firstChild
	if (!(first instanceof Text)) return
	const text = first.data.trimStart()
	const written = WRITTEN_NUMBER.exec(text)
	if (written && Number(written.groups?.number) === position)
		first.data = text.slice(written[0].length)
}

function sectionOf(
	heading: Element,
	index: number,
): Omit<ReadSection, 'parts'> {
	const position = index + 1
	dropWrittenNumber(heading, position)
	return {
		id: `section-${String(position)}`,
		number: String(position).padStart(NUMBER_WIDTH, '0'),
		title: heading.textContent.trim(),
		html: heading.innerHTML,
	}
}

// The placeholder the renderer leaves for a figure fence (renderPlanMarkdown), at the top level.
function figureSource(node: ChildNode): string | null {
	if (node instanceof Element && node.matches('pre[data-plan-figure]'))
		return node.textContent.trimEnd()
	return null
}

// Figures are numbered across the whole body, not per section.
type Cutter = (nodes: readonly ChildNode[]) => ReadPart[]

// A chunk's nodes cut at its figures' placeholders, in order; prose left blank between two
// figures is dropped.
function figureCutter(): Cutter {
	let numbered = 0
	return nodes => {
		const parts: ReadPart[] = []
		const key = (): string => `part-${String(parts.length)}`
		let prose = ''
		const flush = (): void => {
			if (prose.trim())
				parts.push({ key: key(), kind: 'html', html: prose })
			prose = ''
		}
		for (const node of nodes) {
			const source = figureSource(node)
			if (source === null)
				prose +=
					node instanceof Element
						? node.outerHTML
						: esc(node.textContent ?? '')
			else {
				flush()
				parts.push({
					key: key(),
					kind: 'figure',
					source,
					number: ++numbered,
				})
			}
		}
		flush()
		return parts
	}
}

// The body as rendered prose and figures, in an intro and numbered sections. Agent-authored
// markdown goes through the renderer with no raw HTML (the trust boundary), in one pass so
// footnotes and link references reach across figures and sections; reading it only cuts the
// rendered body and drops a heading. Without the renderer (its chunk did not load) the body
// still reads, as its plain text in one part, figures' sources included.
export function readPlan(
	render: ((markdown: string) => string) | null,
	markdown: string,
	title: string,
): PlanReading {
	const body = planBody(markdown)
	if (!render)
		return {
			intro: [
				{
					key: 'part-0',
					kind: 'html',
					html: `<pre>${esc(body)}</pre>`,
				},
			],
			sections: [],
		}
	const doc = new DOMParser().parseFromString(render(body), 'text/html')
	dropTitle(doc.body, title)
	const cut = figureCutter()
	const reading: PlanReading = { intro: [], sections: [] }
	for (const chunk of chunksOf(doc.body)) {
		if (chunk.heading === null) {
			reading.intro.push(...cut(chunk.nodes))
			continue
		}
		const section = sectionOf(chunk.heading, reading.sections.length)
		reading.sections.push({ ...section, parts: cut(chunk.nodes) })
	}
	return reading
}

// The plan's markdown as a file the reviewer keeps, named after the plan's own file.
export function markdownDownload(
	markdown: string,
	path: string,
): { href: string; download: string } {
	return {
		href: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
		download: path.split('/').at(-1) ?? 'plan.md',
	}
}
