import { siblingsOf } from '@entities/site/model/routes'

import type { Page, Section } from '@entities/site/model/site-map'

type Side = 'previous' | 'next'

// One side of the pager: the neighbouring page, or at that end of the
// section the way back to its overview, which has no icon.
export type PagerLink = Pick<Page, 'href' | 'title' | 'blurb'> &
	Partial<Pick<Page, 'icon'>> & { side: Side; direction: string }

// The words pointing each way, to a page or back to the overview.
const DIRECTION: Record<Side, { toPage: string; toOverview: string }> = {
	previous: { toPage: '← Previous', toOverview: '← Back to' },
	next: { toPage: 'Next →', toOverview: 'Back to →' },
}

function linkOf(
	side: Side,
	page: Page | undefined,
	section: Section,
): PagerLink {
	const { toPage, toOverview } = DIRECTION[side]
	if (!page)
		return {
			side,
			direction: toOverview,
			href: section.href,
			title: section.overview,
			blurb: section.footer,
		}
	const { href, title, blurb, icon } = page
	return { side, direction: toPage, href, title, blurb, icon }
}

// The previous and next sides of the route's section pager; none outside a
// section.
export function pagerLinks(route: string): PagerLink[] {
	const siblings = siblingsOf(route)
	if (!siblings) return []
	const { section, previous, next } = siblings
	return [
		linkOf('previous', previous, section),
		linkOf('next', next, section),
	]
}
