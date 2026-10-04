// The site map. Navigation menus, the footer sitemap, breadcrumbs and the
// per-section pagers all read this one table, so a page cannot exist in the
// menu without existing on disk (the build checks every href has a route).

import type { IconName } from './icons'

export const SITE_URL = 'https://syneva.dev'
export const REPO_URL = 'https://github.com/walid-mos/syneva'

// What a page describes: the CLI today, or a prototype direction. Product
// and workflow pages state it in their hero; the menu and the overview rows
// flag a prototype.
export type Availability = 'available' | 'prototype'
export type PreviewName = 'review' | 'guide' | 'ask' | 'plan'

export type Page = {
	href: string
	title: string
	blurb: string
	icon: IconName
	availability?: Availability
	preview?: PreviewName
	code?: string
}

// Menus and the footer list the sections in this order.
export const SECTION_ORDER = ['product', 'workflows', 'resources'] as const
export type SectionId = (typeof SECTION_ORDER)[number]

export type Section = {
	id: SectionId
	label: string
	href: string
	overview: string
	footer: string
	items: Page[]
}

// The type keeps each key and its section's id in step.
export const SECTION_BY_ID: { [Id in SectionId]: Section & { id: Id } } = {
	product: {
		id: 'product',
		label: 'Product',
		href: '/product/',
		overview: 'Product overview',
		footer: 'Every review, one continuous conversation.',
		items: [
			{
				href: '/product/review-desk/',
				title: 'Review desk',
				blurb: 'A verdict on every change your agent made.',
				icon: 'desk',
				availability: 'available',
				preview: 'review',
			},
			{
				href: '/product/walkthrough/',
				title: 'Guided walkthrough',
				blurb: 'A reading order, not a pile of files.',
				icon: 'guide',
				availability: 'available',
				preview: 'guide',
			},
			{
				href: '/product/ask-your-agent/',
				title: 'Ask your agent',
				blurb: 'Questions that stay on the exact line.',
				icon: 'ask',
				availability: 'available',
				preview: 'ask',
			},
			{
				href: '/product/plan-desk/',
				title: 'Plan desk',
				blurb: 'Question the plan before the code exists.',
				icon: 'plan',
				availability: 'prototype',
				preview: 'plan',
			},
		],
	},
	workflows: {
		id: 'workflows',
		label: 'Workflows',
		href: '/workflows/',
		overview: 'All workflows',
		footer: 'On your machine. With your agent.',
		items: [
			{
				href: '/workflows/working-tree/',
				title: 'Working tree',
				blurb: 'Everything your agent just changed.',
				icon: 'tree',
				availability: 'available',
				code: 'syneva',
			},
			{
				href: '/workflows/staged-changes/',
				title: 'Staged changes',
				blurb: 'A last, careful look before the commit.',
				icon: 'staged',
				availability: 'available',
				code: 'syneva --diff staged',
			},
			{
				href: '/workflows/pull-requests/',
				title: 'Pull requests',
				blurb: 'A whole branch, against its merge-base.',
				icon: 'branch',
				availability: 'available',
				code: 'syneva pr 128',
			},
			{
				href: '/workflows/single-file/',
				title: 'A single file',
				blurb: 'A plan, a spec, or one piece of code.',
				icon: 'file',
				availability: 'available',
				code: 'syneva file plan.md',
			},
		],
	},
	resources: {
		id: 'resources',
		label: 'Resources',
		href: '/resources/',
		overview: 'All resources',
		footer: 'Open source. MIT licensed.',
		items: [
			{
				href: '/get-started/',
				title: 'Get started',
				blurb: 'From install to your first verdict.',
				icon: 'start',
			},
			{
				href: '/resources/connect-your-agent/',
				title: 'Connect your agent',
				blurb: 'The pi package and the CLI contract.',
				icon: 'agent',
			},
			{
				href: '/resources/faq/',
				title: 'Questions & answers',
				blurb: 'Local state, agents, and limits.',
				icon: 'faq',
			},
			{
				href: '/resources/changelog/',
				title: 'Changelog',
				blurb: 'What shipped, straight from the history.',
				icon: 'changelog',
			},
		],
	},
}

export const SECTIONS: readonly Section[] = SECTION_ORDER.map(
	id => SECTION_BY_ID[id],
)

export const OPEN_SOURCE: Page = {
	href: '/open-source/',
	title: 'Open source',
	blurb: 'MIT licensed. A protocol you can read.',
	icon: 'source',
}

const PROTOTYPE_BADGE = 'Prototype'

// The badge beside a page's title in the menu and the overview rows: only a
// prototype carries one.
export const badgeOf = (page: Page): string | undefined =>
	page.availability === 'prototype' ? PROTOTYPE_BADGE : undefined

// The availability a route's hero states; overviews and resources state none.
export function availabilityOf(route: string): Availability | undefined {
	const pages = SECTIONS.flatMap(section => section.items)
	return pages.find(page => page.href === route)?.availability
}

// Section of a route, for breadcrumbs, the active nav state and pagers.
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
