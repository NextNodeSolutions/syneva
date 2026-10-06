import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { displayRoot } from '../format'
import { groupsByTurn } from '../overview/groups'
import { JournalAside } from '../overview/react/journal-aside'
import { overview } from '../overview/react/overview.styles'
import { LiveAndClosed } from '../react/live-and-closed'
import { PageHead } from '../react/page-head'
import { dashboardPage } from '../react/page.styles'
import { PhasePage } from '../react/phase-page'

import { ProjectFigures } from './project-figures'

import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'
import type { ProjectProps } from './project-figures'

function ProjectBody({ dashboard, id, desks }: ProjectProps): ReactElement {
	return (
		<div {...stylex.props(overview.split)}>
			<LiveAndClosed
				dashboard={dashboard}
				groups={groupsByTurn(desks, dashboard.since)}
				texts={{
					empty: 'No desk open in this repository.',
					closed: 'Closed here',
				}}
				isKept={closed => closed.projectId === id}
				css={overview.list}
			/>
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
		<div ref={root} {...stylex.props(dashboardPage.root)}>
			<PageHead
				title={named?.project ?? 'Unknown project'}
				lede={
					named
						? displayRoot(named.root)
						: 'The hub has no desk and no record for this repository.'
				}
			/>
			<ProjectFigures dashboard={dashboard} id={id} desks={desks} />
			<ProjectBody dashboard={dashboard} id={id} desks={desks} />
		</div>
	)
}
