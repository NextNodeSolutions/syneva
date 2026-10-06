import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { closedDesks } from '../closed'
import { plural } from '../format'
import { ledgerContext } from '../ledger-context'
import { applyFilter, passes } from '../overview/display'
import { groupsByProject } from '../overview/groups'
import { FilterChips } from '../overview/react/filter-chips'
import { FilterMenu } from '../overview/react/filter-menu'
import { useOverviewView } from '../overview/use-overview-view'
import { ClosedDesks } from '../react/closed-desks'
import { DeskLedger } from '../react/desk-ledger'
import { HoldList } from '../react/hold-list'
import { listPage } from '../react/list-page.styles'
import { PageHead } from '../react/page-head'
import { PhasePage } from '../react/phase-page'
import { useHeldOrder } from '../use-held-order'

import type { ReactElement } from 'react'
import type { DeskFilter } from '../overview/display'
import type { DashboardState, Listed } from '../use-dashboard'

function ReviewsBody({
	dashboard,
	listed,
	filter,
}: {
	dashboard: DashboardState
	listed: Listed
	filter: DeskFilter
}): ReactElement {
	const desks = applyFilter(listed.desks, filter)
	const groups = useHeldOrder(groupsByProject(desks, dashboard.since), {
		isHeld: dashboard.isListHeld,
	})
	const liveIds = new Set(listed.desks.map(desk => desk.id))
	const closed = closedDesks(dashboard.journal.events, liveIds).filter(
		event => passes(event, filter),
	)
	return (
		<HoldList hold={dashboard.hold} css={listPage.body}>
			<DeskLedger
				groups={groups}
				context={ledgerContext(dashboard)}
				emptyText="No live desk under these filters."
			/>
			<ClosedDesks
				closed={closed}
				events={dashboard.journal.events}
				now={dashboard.hub.now}
				title="Closed"
			/>
		</HoldList>
	)
}

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
		<div ref={root} {...stylex.props(listPage.page)}>
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
			<ReviewsBody
				dashboard={dashboard}
				listed={listed}
				filter={view.filter}
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
