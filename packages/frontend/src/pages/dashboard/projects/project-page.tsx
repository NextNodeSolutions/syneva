import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { closedDesks } from '../closed'
import { displayRoot } from '../format'
import { ledgerContext } from '../ledger-context'
import { groupsByTurn } from '../overview/groups'
import { JournalAside } from '../overview/react/journal-aside'
import { overview } from '../overview/react/overview.styles'
import { ClosedDesks } from '../react/closed-desks'
import { DeskLedger } from '../react/desk-ledger'
import { HoldList } from '../react/hold-list'
import { PageHead } from '../react/page-head'
import { PhasePage } from '../react/phase-page'
import { useHeldOrder } from '../use-held-order'

import { ProjectFigures } from './project-figures'

import type { ReactElement } from 'react'
import type { DashboardState, Listed } from '../use-dashboard'
import type { ProjectProps } from './project-figures'

function ProjectBody({
	dashboard,
	id,
	desks,
	listed,
}: ProjectProps & { listed: Listed }): ReactElement {
	const groups = useHeldOrder(
		groupsByTurn(desks, { station: null, since: dashboard.since }),
		{
			isHeld: dashboard.isListHeld,
		},
	)
	const liveIds = new Set(listed.desks.map(desk => desk.id))
	const closed = closedDesks(dashboard.journal.events, liveIds).filter(
		event => event.projectId === id,
	)
	return (
		<div {...stylex.props(overview.split)}>
			<HoldList hold={dashboard.hold} css={overview.list}>
				<DeskLedger
					groups={groups}
					context={ledgerContext(dashboard)}
					emptyText="No desk open in this repository."
				/>
				<ClosedDesks
					closed={closed}
					events={dashboard.journal.events}
					now={dashboard.hub.now}
					title="Closed here"
				/>
			</HoldList>
			<JournalAside
				dashboard={dashboard}
				filter={{ projects: [id], modes: [] }}
			/>
		</div>
	)
}

// One repository: what waits on you there and its numbers, its desks by turn beside its own
// journal, then its closed desks. A repository with no desk left still reads from the journal.
export function ProjectPage({
	dashboard,
	id,
}: {
	dashboard: DashboardState
	id: string
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, id)
	const { listed } = dashboard
	if (!listed) return <PhasePage phase={dashboard.phase} />
	const desks = listed.desks.filter(desk => desk.projectId === id)
	const named =
		desks[0] ??
		dashboard.journal.events.findLast(event => event.projectId === id)
	return (
		<div ref={root} {...stylex.props(overview.page)}>
			<PageHead
				title={named?.project ?? 'Unknown project'}
				lede={
					named
						? displayRoot(named.root)
						: 'The hub has no desk and no record for this repository.'
				}
			/>
			<ProjectFigures dashboard={dashboard} id={id} desks={desks} />
			<ProjectBody
				dashboard={dashboard}
				id={id}
				desks={desks}
				listed={listed}
			/>
		</div>
	)
}
