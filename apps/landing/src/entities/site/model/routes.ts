import { PAGES, SECTIONS, SITE_NAME } from './site-map'

import type { Availability, Page, Section } from './site-map'

// What the site map says about one route: its document title, its section
// and neighbours (the active menu, breadcrumbs, pagers), the name its
// breadcrumb gives it, the availability its hero states and the badge its
// page carries in the menu and the overview rows.

// A route's document title.
export const pageTitle = (name: string): string => `${name} · ${SITE_NAME}`

const pageAt = (route: string): Page | undefined =>
	Object.values(PAGES).find(page => page.href === route)

// Overviews and resources state no availability.
export function availabilityOf(route: string): Availability | undefined {
	const page = pageAt(route)
	if (!page || !('availability' in page)) return undefined
	return page.availability
}

const PROTOTYPE_BADGE = 'Prototype'

// The badge beside a page's title in the menu and the overview rows: only a
// prototype carries one.
export function badgeOf(page: Page): string | undefined {
	if (!('availability' in page) || page.availability !== 'prototype')
		return undefined
	return PROTOTYPE_BADGE
}

// The page's title, or the section's label on the section's overview.
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

export type Siblings = { section?: Section; previous?: Page; next?: Page }

export function siblingsOf(route: string): Siblings {
	const section = sectionOf(route)
	if (!section) return {}
	const index = section.items.findIndex(page => page.href === route)
	if (index < 0) return { section }
	return {
		section,
		previous: section.items[index - 1],
		next: section.items[index + 1],
	}
}
