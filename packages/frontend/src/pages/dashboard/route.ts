import {
	DASHBOARD_PATHS,
	isDashboardPath,
	PROJECT_PAGE_PREFIX,
} from '@syneva/contracts/routes'

// Which page of the dashboard a path names. The hub serves the shell at every dashboard path
// (isDashboardPath); anything else that reaches the shell (a stale link) is the missing page.
export type DashboardPage =
	| { kind: 'overview' }
	| { kind: 'reviews' }
	| { kind: 'projects' }
	| { kind: 'project'; id: string }
	| { kind: 'plans' }
	| { kind: 'settings' }
	| { kind: 'hub' }
	| { kind: 'missing' }

const BY_PATH: Record<string, DashboardPage> = {
	[DASHBOARD_PATHS.overview]: { kind: 'overview' },
	[DASHBOARD_PATHS.reviews]: { kind: 'reviews' },
	[DASHBOARD_PATHS.projects]: { kind: 'projects' },
	[DASHBOARD_PATHS.plans]: { kind: 'plans' },
	[DASHBOARD_PATHS.settings]: { kind: 'settings' },
	[DASHBOARD_PATHS.hub]: { kind: 'hub' },
}

export function pageOf(pathname: string): DashboardPage {
	if (!isDashboardPath(pathname)) return { kind: 'missing' }
	if (pathname.startsWith(PROJECT_PAGE_PREFIX))
		return {
			kind: 'project',
			id: pathname.slice(PROJECT_PAGE_PREFIX.length),
		}
	return BY_PATH[pathname] ?? { kind: 'missing' }
}
