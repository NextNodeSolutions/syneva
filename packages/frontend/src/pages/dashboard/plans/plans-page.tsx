import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { closedDesks } from '../closed'
import { plural } from '../format'
import { ledgerContext } from '../ledger-context'
import { groupsByTurn } from '../overview/groups'
import { ClosedDesks } from '../react/closed-desks'
import { DeskLedger } from '../react/desk-ledger'
import { HoldList } from '../react/hold-list'
import { listPage } from '../react/list-page.styles'
import { PageHead } from '../react/page-head'
import { PhasePage } from '../react/phase-page'
import { useHeldOrder } from '../use-held-order'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../use-dashboard'

const EMPTY_PLANS =
	'No plan under review. Your agent opens one with syneva open file <path>, or the /plan prompt.'

// A plan is reviewed as one file (`syneva open file`, the /plan prompt's desk): the file desks,
// by turn, and the ones closed before them.
function PlansListed({
	dashboard,
	listed,
}: {
	dashboard: DashboardState
	listed: Listed
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'plans')
	const plans = listed.desks.filter(desk => desk.mode === 'file')
	const groups = useHeldOrder(groupsByTurn(plans, dashboard.since), {
		isHeld: dashboard.isListHeld,
	})
	const liveIds = new Set(listed.desks.map(desk => desk.id))
	const closed = closedDesks(dashboard.journal.events, liveIds).filter(
		event => event.mode === 'file',
	)
	return (
		<div ref={root} {...stylex.props(listPage.page)}>
			<PageHead
				title="Plans"
				lede={`${plural(plans.length, 'plan')} under review: the files your agent hands you before it writes code (a plan, a PRD, an issue), each on its own desk.`}
			/>
			<HoldList hold={dashboard.hold} css={listPage.body}>
				<DeskLedger
					groups={groups}
					context={ledgerContext(dashboard)}
					emptyText={EMPTY_PLANS}
				/>
				<ClosedDesks
					closed={closed}
					events={dashboard.journal.events}
					now={dashboard.hub.now}
					title="Closed plans"
				/>
			</HoldList>
		</div>
	)
}

export function PlansPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const { listed } = dashboard
	if (!listed) return <PhasePage phase={dashboard.phase} />
	return <PlansListed dashboard={dashboard} listed={listed} />
}
