import { useRef } from 'react'

import { planDesks } from '@entities/hub/plan-model'
import { turnOf } from '@entities/hub/turn'
import { usePlans } from '@entities/hub/use-plans'
import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../format'
import { listPage } from '../react/list-page.styles'
import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'
import { PhasePage } from '../react/phase-page'

import { PlanLibrary } from './plan-library'

import type { HubDesk } from '@entities/hub/model'
import type { PlansView } from '@entities/hub/use-plans'
import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../use-dashboard'

// The page's lede counts what the library holds and how many of its plans wait on the reviewer.
function ledeOf(library: PlansView, desks: readonly HubDesk[]): string {
	const what =
		'The plans your agent hands you before it writes code, each kept version by version and reviewed on its own desk.'
	if (library.phase !== 'read' || !library.plans.length) return what
	const waiting = planDesks(desks).filter(
		desk => turnOf(desk) === 'yours',
	).length
	const count = plural(library.plans.length, 'plan')
	if (!waiting) return `${count}. ${what}`
	return `${count}, ${String(waiting)} waiting on you. ${what}`
}

// A plan lives in the library: its desk is where it is reviewed, so the page lists plans, each
// with its desk's turn, rather than desks. A file desk that is not a plan is a review like any
// other, listed with the reviews.
function PlansListed({
	dashboard,
	listed,
}: {
	dashboard: DashboardState
	listed: Listed
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'plans')
	const library = usePlans()
	return (
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			<PageHead title="Plans" lede={ledeOf(library, listed.desks)} />
			<div {...stylex.props(listPage.body)}>
				<PlanLibrary
					view={library}
					desks={listed.desks}
					now={dashboard.hub.now}
				/>
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
