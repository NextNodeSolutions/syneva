// The map the menus, footer sitemap, breadcrumbs, heroes and pagers all read; links name pages through it, and the build fails on an internal link without a built target (integrations/linked-pages.ts).

import { LAUNCH_STAGE, START_COMMAND } from './project'

import type { IconName } from '@syneva/design-system/icons'

export const SITE_NAME = 'Syneva'
export const SITE_URL = 'https://syneva.dev'

export type Availability = 'available' | 'prototype'
export type PreviewName = 'review' | 'guide' | 'ask' | 'plan'

type BasePage = { href: string; title: string; blurb: string; icon: IconName }
export type ProductPage = BasePage & {
	availability: Availability
	preview: PreviewName
}
export type WorkflowPage = BasePage & {
	availability: Availability
	code: string
}
export type Page = ProductPage | WorkflowPage | BasePage

const SECTION_ORDER = ['product', 'workflows', 'resources'] as const
export type SectionId = (typeof SECTION_ORDER)[number]

type SectionPages = {
	product: ProductPage
	workflows: WorkflowPage
	resources: BasePage
}

type SectionOf<Id extends SectionId> = {
	id: Id
	label: string
	href: string
	overview: string
	footer: string
	items: readonly SectionPages[Id][]
}

export type Section = { [Id in SectionId]: SectionOf<Id> }[SectionId]

export const HOME_HREF = '/'

export const PAGES = {
	reviewDesk: {
		href: '/product/review-desk/',
		title: 'Review desk',
		blurb: 'A verdict on every change your agent made.',
		icon: 'desk',
		availability: 'available',
		preview: 'review',
	},
	walkthrough: {
		href: '/product/walkthrough/',
		title: 'Guided walkthrough',
		blurb: 'A reading order, not a pile of files.',
		icon: 'guide',
		availability: 'available',
		preview: 'guide',
	},
	askYourAgent: {
		href: '/product/ask-your-agent/',
		title: 'Ask your agent',
		blurb: 'Questions that stay on the exact line.',
		icon: 'ask',
		availability: 'available',
		preview: 'ask',
	},
	planDesk: {
		href: '/product/plan-desk/',
		title: 'Plan desk',
		blurb: 'Question the plan before the code exists.',
		icon: 'plan',
		availability: 'prototype',
		preview: 'plan',
	},
	workingTree: {
		href: '/workflows/working-tree/',
		title: 'Working tree',
		blurb: 'Everything your agent just changed.',
		icon: 'tree',
		availability: 'available',
		code: START_COMMAND,
	},
	stagedChanges: {
		href: '/workflows/staged-changes/',
		title: 'Staged changes',
		blurb: 'A last, careful look before the commit.',
		icon: 'staged',
		availability: 'available',
		code: 'syneva --diff staged',
	},
	pullRequests: {
		href: '/workflows/pull-requests/',
		title: 'Pull requests',
		blurb: 'A whole branch, against its merge-base.',
		icon: 'branch',
		availability: 'available',
		code: 'syneva pr 128',
	},
	singleFile: {
		href: '/workflows/single-file/',
		title: 'A single file',
		blurb: 'A plan, a spec, or one piece of code.',
		icon: 'file',
		availability: 'available',
		code: 'syneva file plan.md',
	},
	getStarted: {
		href: '/get-started/',
		title: 'Get started',
		blurb: 'From install to your first verdict.',
		icon: 'start',
	},
	connectYourAgent: {
		href: '/resources/connect-your-agent/',
		title: 'Connect your agent',
		blurb: 'The pi package and the CLI contract.',
		icon: 'agent',
	},
	faq: {
		href: '/resources/faq/',
		title: 'Questions & answers',
		blurb: 'Local state, agents, and limits.',
		icon: 'faq',
	},
	changelog: {
		href: '/resources/changelog/',
		title: 'Changelog',
		blurb: 'What shipped, straight from the history.',
		icon: 'changelog',
	},
	openSource: {
		href: '/open-source/',
		title: 'Open source',
		blurb: 'MIT licensed. A protocol you can read.',
		icon: 'source',
	},
} satisfies Record<string, Page>

export const SECTION_BY_ID: { [Id in SectionId]: SectionOf<Id> } = {
	product: {
		id: 'product',
		label: 'Product',
		href: '/product/',
		overview: 'Product overview',
		footer: 'Every review, one continuous conversation.',
		items: [
			PAGES.reviewDesk,
			PAGES.walkthrough,
			PAGES.askYourAgent,
			PAGES.planDesk,
		],
	},
	workflows: {
		id: 'workflows',
		label: 'Workflows',
		href: '/workflows/',
		overview: 'All workflows',
		footer: 'On your machine. With your agent.',
		items: [
			PAGES.workingTree,
			PAGES.stagedChanges,
			PAGES.pullRequests,
			PAGES.singleFile,
		],
	},
	resources: {
		id: 'resources',
		label: 'Resources',
		href: '/resources/',
		overview: 'All resources',
		footer: 'Open source. MIT licensed.',
		items: [
			...(LAUNCH_STAGE === 'live' ? [PAGES.getStarted] : []),
			PAGES.connectYourAgent,
			PAGES.faq,
			PAGES.changelog,
		],
	},
}

export const SECTIONS: readonly Section[] = SECTION_ORDER.map(
	id => SECTION_BY_ID[id],
)
