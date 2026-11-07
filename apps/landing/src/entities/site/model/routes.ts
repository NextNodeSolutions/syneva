import { PAGES, SECTIONS, SITE_NAME } from './site-map'

import type { Availability, Page, Section } from './site-map'

export const pageTitle = (name: string): string => `${name} · ${SITE_NAME}`

const pageAt = (route: string): Page | undefined =>
	Object.values(PAGES).find(page => page.href === route)

export function availabilityOf(route: string): Availability | undefined {
	const page = pageAt(route)
	if (!page || !('availability' in page)) return undefined
	return page.availability
}

const PROTOTYPE_BADGE = 'Prototype'

export function badgeOf(page: Page): string | undefined {
	if (!('availability' in page) || page.availability !== 'prototype')
		return undefined
	return PROTOTYPE_BADGE
}

export function crumbOf(route: string): string {
	const section = SECTIONS.find(candidate => candidate.href === route)
	if (section) return section.label
	const page = pageAt(route)
	if (!page)
		throw new Error(
			`${route} has a page hero but no entry in the site map: add its page to PAGES in src/entities/site/model/site-map.ts.`,
		)
	return page.title
}

export function sectionOf(route: string): Section | undefined {
	return SECTIONS.find(
		section =>
			route === section.href ||
			section.items.some(page => page.href === route),
	)
}

export type Siblings = { section: Section; previous?: Page; next?: Page }

export function siblingsOf(route: string): Siblings | undefined {
	const section = sectionOf(route)
	if (!section) return undefined
	const index = section.items.findIndex(page => page.href === route)
	if (index < 0) return { section }
	return {
		section,
		previous: section.items[index - 1],
		next: section.items[index + 1],
	}
}
