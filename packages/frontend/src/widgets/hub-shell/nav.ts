import { groupByProject } from '@entities/hub/model'
import { turnCounts } from '@entities/hub/turn'
import { DASHBOARD_PATHS, PROJECT_PAGE_PREFIX } from '@syneva/contracts/routes'

import type { HubDesk } from '@entities/hub/model'
import type { ShellIconName } from './shell-icons'

export type NavId = keyof typeof DASHBOARD_PATHS

// What the navigation counts beside its entries: the desks waiting on the reviewer (the one
// count in petrol: it is the reason to come), every live desk, the repositories, the plans.
export type NavCounts = {
	yours: number
	reviews: number
	projects: number
	plans: number
}

export type NavEntry = {
	id: NavId
	label: string
	href: string
	icon: ShellIconName
	count?: keyof NavCounts | undefined
}

// The work: where each round stands, every review, by repository, the plans.
export const WORK_NAV: readonly NavEntry[] = [
	{
		id: 'overview',
		label: 'Overview',
		href: DASHBOARD_PATHS.overview,
		icon: 'overview',
		count: 'yours',
	},
	{
		id: 'reviews',
		label: 'Reviews',
		href: DASHBOARD_PATHS.reviews,
		icon: 'reviews',
		count: 'reviews',
	},
	{
		id: 'projects',
		label: 'Projects',
		href: DASHBOARD_PATHS.projects,
		icon: 'projects',
		count: 'projects',
	},
	{
		id: 'plans',
		label: 'Plans',
		href: DASHBOARD_PATHS.plans,
		icon: 'plans',
		count: 'plans',
	},
]

// The hub itself: the reviewer's preferences, the hub's health and the agents on it.
export const HUB_NAV: readonly NavEntry[] = [
	{
		id: 'settings',
		label: 'Settings',
		href: DASHBOARD_PATHS.settings,
		icon: 'settings',
	},
	{ id: 'hub', label: 'Hub', href: DASHBOARD_PATHS.hub, icon: 'hub' },
]

// The entry the page at `pathname` belongs to; a project's own page belongs to Projects, and a
// desk's page (the rail) to none.
export function currentNav(pathname: string): NavId | null {
	if (pathname.startsWith(PROJECT_PAGE_PREFIX)) return 'projects'
	const entry = [...WORK_NAV, ...HUB_NAV].find(nav => nav.href === pathname)
	return entry?.id ?? null
}

// The navigation's counts for a listing; null before the hub's first one.
export function navCountsOf(
	desks: readonly HubDesk[] | null,
): NavCounts | null {
	if (!desks) return null
	return {
		yours: turnCounts(desks).yours,
		reviews: desks.length,
		projects: groupByProject(desks).length,
		plans: desks.filter(desk => desk.mode === 'file').length,
	}
}
