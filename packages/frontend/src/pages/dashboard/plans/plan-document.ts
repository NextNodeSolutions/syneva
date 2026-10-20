import type { PlanMarkdown } from '../markdown'

// A plan's front matter (title, summary) is the record's, read by the hub: the page shows it
// in its head, so the body starts after it.
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/

export function planBody(markdown: string): string {
	return markdown.replace(FRONT_MATTER, '')
}

export type PlanSection = { id: string; title: string }

export type PlanReading = { html: string; sections: PlanSection[] }

// The rendered body with its sections named: each h2 gets an id the table of contents links
// to. A first h1 that only repeats the plan's title is dropped, since the page's head already
// states it. Agent-authored markdown goes through the renderer with no raw HTML (the trust
// boundary); this only adds ids and removes a heading.
export function readPlan(
	engine: PlanMarkdown,
	markdown: string,
	title: string,
): PlanReading {
	const html = engine.renderGuideMarkdown(planBody(markdown))
	const doc = new DOMParser().parseFromString(html, 'text/html')
	const first = doc.body.firstElementChild
	if (first?.tagName === 'H1' && first.textContent.trim() === title.trim())
		first.remove()
	const sections: PlanSection[] = []
	for (const heading of doc.body.querySelectorAll('h2')) {
		const id = `section-${String(sections.length + 1)}`
		heading.setAttribute('id', id)
		sections.push({ id, title: heading.textContent.trim() })
	}
	return { html: doc.body.innerHTML, sections }
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
