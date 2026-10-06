import { useRef } from 'react'

import { hubPlace } from '@entities/hub/hub-place'
import { turnOf } from '@entities/hub/turn'
import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { headCopy } from '../../head-copy'
import { PageHead } from '../../react/page-head'
import { PhasePage } from '../../react/phase-page'
import { applyFilter } from '../display'
import { turnSummary } from '../overview-copy'
import { useDisplayPrefs } from '../use-display-prefs'
import { useOverviewView } from '../use-overview-view'

import { DisplayMenu } from './display-menu'
import { FilterChips } from './filter-chips'
import { FilterMenu } from './filter-menu'
import { OverviewBody } from './overview-body'
import { overview } from './overview.styles'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../../use-dashboard'

function OverviewListed({
	dashboard,
	listed,
}: {
	dashboard: DashboardState
	listed: Listed
}): ReactElement {
	const view = useOverviewView()
	const prefs = useDisplayPrefs()
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, view.layout)
	const filtered = applyFilter(listed.desks, view.filter)
	const desks = prefs.showsIdle
		? filtered
		: filtered.filter(desk => turnOf(desk) !== 'idle')
	return (
		<div ref={root} {...stylex.props(overview.page)}>
			<PageHead
				title={headCopy(dashboard.phase, hubPlace()).title}
				lede={turnSummary(listed.desks)}
			>
				<FilterMenu
					desks={listed.desks}
					projects={dashboard.projects}
					filter={view.filter}
					onFilter={filter => view.change({ filter })}
				/>
				<DisplayMenu
					layout={view.layout}
					onLayout={layout => view.change({ layout })}
					prefs={prefs}
				/>
			</PageHead>
			<FilterChips
				filter={view.filter}
				projects={dashboard.projects}
				onFilter={filter => view.change({ filter })}
			/>
			<OverviewBody
				dashboard={dashboard}
				desks={desks}
				view={view}
				prefs={prefs}
			/>
		</div>
	)
}

// The overview: whose turn it is on every desk, in the display the reviewer picked (the
// circuit by default, the board, the cockpit), under the filters they set. Before there is a
// listing to show, the page says why.
export function OverviewPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const { listed } = dashboard
	if (!listed?.desks.length)
		return (
			<PhasePage
				phase={dashboard.phase}
				onNewReview={dashboard.newReview.offer}
			/>
		)
	return <OverviewListed dashboard={dashboard} listed={listed} />
}
