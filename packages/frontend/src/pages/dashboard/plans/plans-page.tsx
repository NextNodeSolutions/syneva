import { useRef } from 'react'

import { usePlans } from '@entities/hub/use-plans'
import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../format'
import { groupsByTurn } from '../overview/groups'
import { listPage } from '../react/list-page.styles'
import { LiveAndClosed } from '../react/live-and-closed'
import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'
import { PhasePage } from '../react/phase-page'

import { PlanLibrary } from './plan-library'
import { planLibrary } from './plan-library.styles'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../use-dashboard'

const EMPTY_PLANS =
	'No plan under review. Your agent opens one with syneva open plan <path>, or the /plan prompt.'

// A plan is reviewed as one file (`syneva open plan`, the /plan prompt's desk): the file desks,
// by turn, and the ones closed before them; then the library, every plan the hub keeps.
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
	const library = usePlans()
	return (
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			<PageHead
				title="Plans"
				lede={`${plural(plans.length, 'plan')} under review: the files your agent hands you before it writes code (a plan, a PRD, an issue), each on its own desk, and the library that keeps every version.`}
			/>
			<LiveAndClosed
				dashboard={dashboard}
				groups={groupsByTurn(plans, dashboard.since)}
				texts={{ empty: EMPTY_PLANS, closed: 'Closed plans' }}
				isKept={closed => closed.mode === 'file'}
				css={[listPage.body, planLibrary.flush]}
			/>
			<div {...stylex.props(listPage.body)}>
				<PlanLibrary view={library} now={dashboard.hub.now} />
			</div>
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
