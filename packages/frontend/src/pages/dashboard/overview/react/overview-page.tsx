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
import { EmptyOverview } from './empty-overview'
import { FilterChips } from './filter-chips'
import { FilterMenu } from './filter-menu'
import { OverviewBody } from './overview-body'
import { overview } from './overview.styles'

import type { ReactElement } from 'react'
import type { HubPhase } from '../../hub-phase'
import type { DashboardState, Listed } from '../../use-dashboard'

const LOADING_PHASE: HubPhase = { kind: 'loading' }

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
// circuit by default, the board, the cockpit), under the filters they set. Before any listing
// the page says why (a phase page); a listing with no desk is the empty overview: the way to
// open one, and the desks closed before.
export function OverviewPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const { listed } = dashboard
	if (!listed) return <PhasePage phase={dashboard.phase} />
	// The listing waits for the journal's first read (it orders the desks by how long their
	// turn has lasted), so the page mounts once, in its final order: nothing reshuffles under
	// its entrance. The loading head stays hidden for a quick read.
	if (!dashboard.journal.isRead) return <PhasePage phase={LOADING_PHASE} />
	if (!listed.desks.length) return <EmptyOverview dashboard={dashboard} />
	return <OverviewListed dashboard={dashboard} listed={listed} />
}
