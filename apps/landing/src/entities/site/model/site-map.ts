// The site map. Navigation menus, the footer sitemap, breadcrumbs and the
// per-section pagers all read this one table, so a page cannot exist in the
// menu without existing on disk (the build checks every href has a route).

export const SITE_URL = 'https://syneva.dev'
export const REPO_URL = 'https://github.com/walid-mos/syneva'

// 24px line icons, drawn on the same 1.4 stroke as the rest of the menu.
export const ICONS = {
	desk: 'M3 5h18v14H3zM10 5v14M13 11.5l2 2 4-4.5',
	guide: 'M3 5h3v3H3zM3 10.5h3v3H3zM3 16h3v3H3zM9 6.5h12M9 12h12M9 17.5h7',
	ask: 'M4 4h16v11h-9l-5 4v-4H4zM9.5 8.4a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 13.4v.1',
	plan: 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h3v6h4M12 11h4',
	tree: 'M4 3v18M4 7h5M4 15h5M9 5h11v4H9zM9 13h11v4H9z',
	staged: 'M3 9.5 12 5l9 4.5-9 4.5zM3 14l9 4.5 9-4.5',
	branch: 'M6 3v12M6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM18 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM18 9c0 4-3 6-12 6',
	file: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h4',
	start: 'M3 5h18v14H3zM7 10l3 2.5L7 15M12.5 15h4.5',
	agent: 'M3 8h6v8H3zM15 8h6v8h-6zM9 12h6M12 9.5v5',
	faq: 'M4 4h16v16H4zM9.5 9.4a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 16.2v.1',
	changelog: 'M6 3v18M10 6h10M10 12h10M10 18h7M4.5 6h3M4.5 12h3M4.5 18h3',
	source: 'M8 4c-2 0-3 1-3 3v3l-2 2 2 2v3c0 2 1 3 3 3M16 4c2 0 3 1 3 3v3l2 2-2 2v3c0 2-1 3-3 3',
} as const

export type IconName = keyof typeof ICONS
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
