import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../format'
import { applyFilter, passes } from '../overview/display'
import { groupsByProject } from '../overview/groups'
import { FilterChips } from '../overview/react/filter-chips'
import { FilterMenu } from '../overview/react/filter-menu'
import { useOverviewView } from '../overview/use-overview-view'
import { listPage } from '../react/list-page.styles'
import { LiveAndClosed } from '../react/live-and-closed'
import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'
import { PhasePage } from '../react/phase-page'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../use-dashboard'

function ReviewsListed({
	dashboard,
	listed,
}: {
	dashboard: DashboardState
	listed: Listed
}): ReactElement {
	const view = useOverviewView()
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'reviews')
	const lede = `${plural(listed.desks.length, 'live desk')} in ${plural(dashboard.projects.length, 'repository', 'repositories')}, with the desks closed before them.`
	return (
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			<PageHead title="Reviews" lede={lede}>
				<FilterMenu
					desks={listed.desks}
					projects={dashboard.projects}
					filter={view.filter}
					onFilter={filter => view.change({ filter })}
				/>
			</PageHead>
			<FilterChips
				filter={view.filter}
				projects={dashboard.projects}
				onFilter={filter => view.change({ filter })}
			/>
			<LiveAndClosed
				dashboard={dashboard}
				groups={groupsByProject(
					applyFilter(listed.desks, view.filter),
					dashboard.since,
				)}
				texts={{
					empty: 'No live desk under these filters.',
					closed: 'Closed',
				}}
				isKept={closed => passes(closed, view.filter)}
				css={listPage.body}
			/>
		</div>
	)
}

// Every review the hub holds: the live desks by repository, then the ones closed before them,
// which reopen with their verdicts.
export function ReviewsPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const { listed } = dashboard
	if (!listed) return <PhasePage phase={dashboard.phase} />
	return <ReviewsListed dashboard={dashboard} listed={listed} />
}
