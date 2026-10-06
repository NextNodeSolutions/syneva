import { sectionLabel } from '@shared/ui/section-label.styles'
import * as stylex from '@stylexjs/stylex'

import { plural } from '../../format'
import { turnLasted } from '../../turn-age'
import { cockpitStats, reviewFigure, weekDelta } from '../cockpit-stats'

import { cockpit } from './cockpit.styles'
import { RoundsChart } from './rounds-chart'
import { StatTile } from './stat-tile'
import { VerdictRows } from './verdict-rows'

import type { JournalEvent } from '@entities/hub/journal'
import type { HubDesk } from '@entities/hub/model'
import type { ReactElement, ReactNode } from 'react'
import type { CockpitStats } from '../cockpit-stats'

function CockpitTiles({
	stats,
	oldestWait,
	now,
}: {
	stats: CockpitStats
	oldestWait: string | null
	now: number
}): ReactElement {
	const waited = oldestWait
		? `The longest has waited ${turnLasted(oldestWait, now)}`
		: 'Nothing waits on you'
	return (
		<div {...stylex.props(cockpit.tiles)}>
			<StatTile
				label="Wait on you"
				stat={{ figure: stats.yours }}
				sub={waited}
				isYours
			/>
			<StatTile
				label="Agents working"
				stat={{ figure: stats.agent }}
				sub="Acting on a review now"
			/>
			<StatTile
				label="Rounds this week"
				stat={{ figure: stats.roundsThisWeek }}
				sub={weekDelta(stats.roundsThisWeek, stats.roundsWeekBefore)}
			/>
			<StatTile
				label="Your median review"
				stat={reviewFigure(stats.medianReview)}
				sub="From the diff landing to your Send"
			/>
		</div>
	)
}

function FigureCell({
	id,
	title,
	note,
	children,
}: {
	id: string
	title: string
	note: string
	children: ReactNode
}): ReactElement {
	return (
		<section
			{...stylex.props(cockpit.cell)}
			aria-labelledby={id}
			data-enter="fade"
		>
			<div {...stylex.props(cockpit.cellHead)}>
				<h2 id={id} {...stylex.props(sectionLabel.base)}>
					{title}
				</h2>
				<p {...stylex.props(cockpit.cellNote)}>{note}</p>
			</div>
			{children}
		</section>
	)
}

type CockpitViewProps = {
	desks: readonly HubDesk[]
	events: readonly JournalEvent[]
	now: number
	// When the reviewer's longest-waiting desk landed, if one waits.
	oldestWait: string | null
	// What comes under the figures: the same ledger (and journal) as every display.
	children: ReactNode
}

// The cockpit: the hub in numbers (what waits on you, what your agents are doing, the rounds
// of the week and how long a review takes you), the last two weeks of rounds, this week's
// verdicts, then the same ledger as every display.
export function CockpitView({
	desks,
	events,
	now,
	oldestWait,
	children,
}: CockpitViewProps): ReactElement {
	const stats = cockpitStats(desks, events, now)
	const { verdicts } = stats
	const rounds = stats.perDay.reduce((sum, count) => sum + count, 0)
	const changes =
		verdicts.accepted + verdicts.rejected + verdicts.requestedChanges
	return (
		<div {...stylex.props(cockpit.root)}>
			<CockpitTiles stats={stats} oldestWait={oldestWait} now={now} />
			<div {...stylex.props(cockpit.figures)}>
				<FigureCell
					id="rounds-title"
					title="Rounds sent · last 14 days"
					note={plural(rounds, 'round')}
				>
					<RoundsChart counts={stats.perDay} now={now} />
				</FigureCell>
				<FigureCell
					id="verdicts-title"
					title="Verdicts this week"
					note={plural(changes, 'change')}
				>
					<VerdictRows totals={verdicts} />
				</FigureCell>
			</div>
			{children}
		</div>
	)
}
