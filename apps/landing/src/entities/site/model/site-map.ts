// The site map. Navigation menus, the footer sitemap, breadcrumbs and the
// per-section pagers all read this one table, so a page cannot exist in the
// menu without existing on disk (the build checks every href has a route).

import type { IconName } from './icons'

export const SITE_URL = 'https://syneva.dev'
export const REPO_URL = 'https://github.com/walid-mos/syneva'

export type PreviewName = 'review' | 'guide' | 'ask' | 'plan'

export type Page = {
	href: string
	title: string
	blurb: string
	icon: IconName
	badge?: string
	preview?: PreviewName
	code?: string
}

export type SectionId = 'product' | 'workflows' | 'resources'

export type Section = {
	id: SectionId
	label: string
	href: string
	overview: string
	footer: string
	items: Page[]
}

export const SECTIONS: Section[] = [
	{
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
				preview: 'review',
			},
			{
				href: '/product/walkthrough/',
				title: 'Guided walkthrough',
				blurb: 'A reading order, not a pile of files.',
				icon: 'guide',
				preview: 'guide',
			},
			{
				href: '/product/ask-your-agent/',
				title: 'Ask your agent',
				blurb: 'Questions that stay on the exact line.',
				icon: 'ask',
				preview: 'ask',
			},
			{
				href: '/product/plan-desk/',
				title: 'Plan desk',
				badge: 'Prototype',
				blurb: 'Question the plan before the code exists.',
				icon: 'plan',
				preview: 'plan',
			},
		],
	},
	{
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
				code: 'syneva',
			},
			{
				href: '/workflows/staged-changes/',
				title: 'Staged changes',
				blurb: 'A last, careful look before the commit.',
				icon: 'staged',
				code: 'syneva --diff staged',
			},
			{
				href: '/workflows/pull-requests/',
				title: 'Pull requests',
				blurb: 'A whole branch, against its merge-base.',
				icon: 'branch',
				code: 'syneva pr 128',
			},
			{
				href: '/workflows/single-file/',
				title: 'A single file',
				blurb: 'A plan, a spec, or one piece of code.',
				icon: 'file',
				code: 'syneva file plan.md',
			},
		],
	},
	{
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
]

export const OPEN_SOURCE: Page = {
	href: '/open-source/',
	title: 'Open source',
	blurb: 'MIT licensed. A protocol you can read.',
	icon: 'source',
}

export function sectionById(id: SectionId): Section {
	const section = SECTIONS.find(candidate => candidate.id === id)
	if (!section) throw new Error(`unknown section: ${id}`)
	return section
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
