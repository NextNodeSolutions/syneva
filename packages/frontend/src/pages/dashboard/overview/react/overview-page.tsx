import { useRef } from 'react'

import { turnOf } from '@entities/hub/turn'
import { MOTION_MS } from '@shared/lib/motion'
import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { dashboardPage } from '../../react/page.styles'
import { PhasePage } from '../../react/phase-page'
import { applyFilter } from '../display'
import { useDisplayPrefs } from '../use-display-prefs'
import { useOverviewView } from '../use-overview-view'

import { EmptyOverview } from './empty-overview'
import { OverviewBody } from './overview-body'
import { OverviewHead } from './overview-head'
import { overview } from './overview.styles'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../../use-dashboard'

// The body steps in after the head's two entrances (its statement, then its controls), as it
// would in one entrance over the whole page.
const HEAD_ENTRANCES = 2
const BODY_LEAD_MS = HEAD_ENTRANCES * MOTION_MS.step

function OverviewListed({
	dashboard,
	listed,
}: {
	dashboard: DashboardState
	listed: Listed
}): ReactElement {
	const view = useOverviewView()
	const prefs = useDisplayPrefs()
	const body = useRef<HTMLDivElement>(null)
	// The body enters again with each display the reviewer picks, while the head (and the
	// Display panel they picked it in, still open) holds still above it.
	useEntrance(body, view.layout, BODY_LEAD_MS)
	const filtered = applyFilter(listed.desks, view.filter)
	const desks = prefs.showsIdle
		? filtered
		: filtered.filter(desk => turnOf(desk) !== 'idle')
	return (
		<div {...stylex.props(dashboardPage.root)}>
			<OverviewHead
				dashboard={dashboard}
				listed={listed}
				view={view}
				prefs={prefs}
			/>
			<div ref={body} {...stylex.props(overview.part)}>
				<OverviewBody
					dashboard={dashboard}
					desks={desks}
					view={view}
					prefs={prefs}
				/>
			</div>
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
	if (!listed.desks.length) return <EmptyOverview dashboard={dashboard} />
	return <OverviewListed dashboard={dashboard} listed={listed} />
}
