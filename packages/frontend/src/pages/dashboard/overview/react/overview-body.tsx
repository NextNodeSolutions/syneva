import { turnOf } from '@entities/hub/turn'
import * as stylex from '@stylexjs/stylex'

import { ledgerContext } from '../../ledger-context'
import { DeskLedger } from '../../react/desk-ledger'
import { HoldList } from '../../react/hold-list'
import { useHeldOrder } from '../../use-held-order'
import { groupsByProject, groupsByTurn } from '../groups'

import { BoardView } from './board-view'
import { CircuitBand } from './circuit-band'
import { CockpitView } from './cockpit-view'
import { JournalAside } from './journal-aside'
import { overview } from './overview.styles'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DashboardState } from '../../use-dashboard'
import type { DisplayPrefsState } from '../use-display-prefs'
import type { OverviewViewState } from '../use-overview-view'

type OverviewBodyProps = {
	dashboard: DashboardState
	// The desks the filters and the display's choices leave.
	desks: readonly HubDesk[]
	view: OverviewViewState
	prefs: DisplayPrefsState
}

// The ledger and the journal beside it, as every display ends. The ledger holds its order
// while the reviewer is in it (use-held-order.ts).
function LedgerAndJournal({
	dashboard,
	desks,
	view,
	prefs,
}: OverviewBodyProps): ReactElement {
	const listed = view.station
		? desks.filter(desk => turnOf(desk) === view.station)
		: desks
	const groups = useHeldOrder(
		prefs.grouping === 'turn'
			? groupsByTurn(listed, { station: null, since: dashboard.since })
			: groupsByProject(listed, dashboard.since),
		{ isHeld: dashboard.isListHeld },
	)
	return (
		<div {...stylex.props(overview.split)}>
			<HoldList hold={dashboard.hold} css={overview.list}>
				<DeskLedger
					groups={groups}
					context={ledgerContext(dashboard)}
					emptyText="No desk here under these filters."
				/>
			</HoldList>
			{prefs.showsJournal && (
				<JournalAside dashboard={dashboard} filter={view.filter} />
			)}
		</div>
	)
}

// The overview under its head, in the chosen display: the circuit above the ledger, the
// board, or the cockpit's numbers above it. The board's cards are the ledger there, so only
// the journal follows it.
export function OverviewBody(props: OverviewBodyProps): ReactElement {
	const { dashboard, desks, view } = props
	const isLive = dashboard.listed?.isStale !== true
	if (view.layout === 'board')
		return (
			<>
				<BoardView
					desks={desks}
					now={dashboard.hub.now}
					isLive={isLive}
					since={dashboard.since}
					close={dashboard.close}
				/>
				{props.prefs.showsJournal && (
					<JournalAside dashboard={dashboard} filter={view.filter} />
				)}
			</>
		)
	if (view.layout === 'cockpit') {
		const yours = desks
			.filter(desk => turnOf(desk) === 'yours')
			.map(dashboard.since)
		return (
			<CockpitView
				desks={desks}
				events={dashboard.journal.events}
				now={dashboard.hub.now}
				oldestWait={yours.toSorted()[0] ?? null}
			>
				<LedgerAndJournal
					{...props}
					view={{ ...view, station: null }}
				/>
			</CockpitView>
		)
	}
	return (
		<>
			<CircuitBand
				desks={desks}
				station={view.station}
				isLive={isLive}
				onSelect={station => view.change({ station })}
			/>
			<LedgerAndJournal {...props} />
		</>
	)
}
