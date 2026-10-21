import { esc } from '@shared/lib/esc'

import { markFigures } from './plan-figures'

import type { PlanMarkdown } from '../markdown'
import type { MarkedFigure, PlanFigure } from './plan-figures'

// A plan's front matter (title, summary) is the record's, read by the hub: the page shows it
// in its head, so the body starts after it.
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/

export function planBody(markdown: string): string {
	return markdown.replace(FRONT_MATTER, '')
}

export type PlanSection = { id: string; title: string }

// Each part keyed by its place in the body, which is what it is while the reading lasts.
export type ReadPart =
	| { key: string; kind: 'html'; html: string }
	| { key: string; kind: 'figure'; figure: PlanFigure }

export type PlanReading = { parts: ReadPart[]; sections: PlanSection[] }

// The rendered body's sections named: each h2 gets an id the table of contents links to. A
// first h1 that only repeats the plan's title is dropped, since the page's head already
// states it.
function nameSections(body: HTMLElement, title: string): PlanSection[] {
	const first = body.firstElementChild
	if (first?.tagName === 'H1' && first.textContent.trim() === title.trim())
		first.remove()
	const sections: PlanSection[] = []
	for (const heading of body.querySelectorAll('h2')) {
		const id = `section-${String(sections.length + 1)}`
		heading.setAttribute('id', id)
		sections.push({ id, title: heading.textContent.trim() })
	}
	return sections
}

// The rendered body cut at its figures' markers (plan-figures.ts), in order; prose left blank
// between two figures is dropped.
function cutAtFigures(
	body: HTMLElement,
	figures: readonly MarkedFigure[],
): ReadPart[] {
	const byMarker = new Map(figures.map(entry => [entry.marker, entry.figure]))
	const parts: ReadPart[] = []
	let prose = ''
	const flush = (): void => {
		if (prose.trim())
			parts.push({
				key: `part-${String(parts.length)}`,
				kind: 'html',
				html: prose,
			})
		prose = ''
	}
	for (const node of body.childNodes) {
		const figure =
			node instanceof HTMLParagraphElement
				? byMarker.get(node.textContent.trim())
				: undefined
		if (figure) {
			flush()
			parts.push({
				key: `part-${String(parts.length)}`,
				kind: 'figure',
				figure,
			})
		} else
			prose +=
				node instanceof Element
					? node.outerHTML
					: esc(node.textContent ?? '')
	}
	flush()
	return parts
}

// The body as rendered prose and figures, in order. Agent-authored markdown goes through the
// renderer with no raw HTML (the trust boundary), in one pass so footnotes and link references
// reach across figures; naming sections only adds ids and removes a heading. Without the
// renderer (its chunk did not load) the body still reads, as its plain text in one part,
// figures' sources included.
export function readPlan(
	engine: PlanMarkdown | null,
	markdown: string,
	title: string,
): PlanReading {
	const body = planBody(markdown)
	if (!engine)
		return {
			parts: [
				{
					key: 'part-0',
					kind: 'html',
					html: `<pre>${esc(body)}</pre>`,
				},
			],
			sections: [],
		}
	const marked = markFigures(body)
	const doc = new DOMParser().parseFromString(
		engine.renderGuideMarkdown(marked.markdown),
		'text/html',
	)
	const sections = nameSections(doc.body, title)
	return { parts: cutAtFigures(doc.body, marked.figures), sections }
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
