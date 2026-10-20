import { esc } from '@shared/lib/esc'

import { splitFigures } from './plan-figures'

import type { PlanMarkdown } from '../markdown'
import type { PlanFigure } from './plan-figures'

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

type Named = { html: string; sections: PlanSection[] }

// One prose part with its sections named: each h2 gets an id the table of contents links to,
// numbered on from `start`. A leading h1 that only repeats the plan's title is dropped, since
// the page's head already states it.
function nameSections(
	html: string,
	start: number,
	title: string | null,
): Named {
	const doc = new DOMParser().parseFromString(html, 'text/html')
	const first = doc.body.firstElementChild
	if (
		title &&
		first?.tagName === 'H1' &&
		first.textContent.trim() === title.trim()
	)
		first.remove()
	const sections: PlanSection[] = []
	for (const heading of doc.body.querySelectorAll('h2')) {
		const id = `section-${String(start + sections.length + 1)}`
		heading.setAttribute('id', id)
		sections.push({ id, title: heading.textContent.trim() })
	}
	return { html: doc.body.innerHTML, sections }
}

// The body as rendered prose and figures, in order. Agent-authored markdown goes through the
// renderer with no raw HTML (the trust boundary); naming sections only adds ids and removes a
// heading. Without the renderer (its chunk did not load) the body still reads, as its plain
// text in one part, figures' sources included.
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
	const reading: PlanReading = { parts: [], sections: [] }
	for (const part of splitFigures(body)) {
		const key = `part-${String(reading.parts.length)}`
		if (part.kind === 'figure') {
			reading.parts.push({ key, ...part })
			continue
		}
		const isFirst = !reading.parts.length
		const named = nameSections(
			engine.renderGuideMarkdown(part.markdown),
			reading.sections.length,
			isFirst ? title : null,
		)
		reading.parts.push({ key, kind: 'html', html: named.html })
		reading.sections.push(...named.sections)
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
