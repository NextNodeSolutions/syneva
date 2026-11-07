import { siblingsOf } from '@entities/site/model/routes'

import type { Page, Section } from '@entities/site/model/site-map'

type Side = 'previous' | 'next'

export type PagerLink = Pick<Page, 'href' | 'title' | 'blurb'> &
	Partial<Pick<Page, 'icon'>> & { side: Side; direction: string }

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

export function pagerLinks(route: string): PagerLink[] {
	const siblings = siblingsOf(route)
	if (!siblings) return []
	const { section, previous, next } = siblings
	return [
		linkOf('previous', previous, section),
		linkOf('next', next, section),
	]
}
