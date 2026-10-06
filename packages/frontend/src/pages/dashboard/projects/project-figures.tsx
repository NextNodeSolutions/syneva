import * as stylex from '@stylexjs/stylex'

import { cockpitStats, reviewFigure } from '../overview/cockpit-stats'
import { cockpit } from '../overview/react/cockpit.styles'
import { StatTile } from '../overview/react/stat-tile'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'

export type ProjectProps = {
	dashboard: DashboardState
	id: string
	desks: readonly HubDesk[]
}

// One repository in numbers: what waits on you there, its live desks, its rounds this week and
// how long a review takes you there.
export function ProjectFigures({
	dashboard,
	id,
	desks,
}: ProjectProps): ReactElement {
	const stats = cockpitStats(
		desks,
		dashboard.journal.events.filter(event => event.projectId === id),
		dashboard.hub.now,
	)
	return (
		<div {...stylex.props(cockpit.root)}>
			<div {...stylex.props(cockpit.tiles)}>
				<StatTile
					label="Wait on you"
					stat={{ figure: stats.yours }}
					sub="Agents blocked on your review"
					isYours
				/>
				<StatTile
					label="Live desks"
					stat={{ figure: desks.length }}
					sub="Open on this hub"
				/>
				<StatTile
					label="Rounds this week"
					stat={{ figure: stats.roundsThisWeek }}
					sub="Reviews you sent here"
				/>
				<StatTile
					label="Your median review"
					stat={reviewFigure(stats.medianReview)}
					sub="From the diff landing to your Send"
				/>
			</div>
		</div>
	)
}
