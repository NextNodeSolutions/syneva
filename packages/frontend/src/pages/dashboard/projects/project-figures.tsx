import {
	DAY_MS,
	median,
	reviewTimes,
	roundsSince,
	WEEK_DAYS,
} from '@entities/hub/journal-stats'
import { turnCounts } from '@entities/hub/turn'
import * as stylex from '@stylexjs/stylex'

import { reviewFigure } from '../overview/cockpit-stats'
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
	const events = dashboard.journal.events.filter(
		event => event.projectId === id,
	)
	const weekAgo = dashboard.hub.now - WEEK_DAYS * DAY_MS
	const recent = events.filter(event => Date.parse(event.at) >= weekAgo)
	return (
		<div {...stylex.props(cockpit.root)}>
			<div {...stylex.props(cockpit.tiles)}>
				<StatTile
					label="Wait on you"
					stat={{ figure: turnCounts(desks).yours }}
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
					stat={{ figure: roundsSince(events, weekAgo).length }}
					sub="Reviews you sent here"
				/>
				<StatTile
					label="Your median review"
					stat={reviewFigure(median(reviewTimes(recent)))}
					sub="From the diff landing to your Send"
				/>
			</div>
		</div>
	)
}
