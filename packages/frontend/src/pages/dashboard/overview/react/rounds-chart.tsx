import { dayStartBefore } from '@entities/hub/journal-stats'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { a11y } from '@syneva/design-system/a11y.styles'

import { plural, SHORT_DATE } from '../../format'

import { roundsChart } from './rounds-chart.styles'
import { slotMarker } from './rounds-chart.stylex'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// Every other day is named under the axis (today always), so the labels never crowd.
const LABEL_EVERY = 2
// The slots at either end whose tip would run past the cell: anchored to their own edge.
const EDGE_SLOTS = 2

// Where a day's tip opens: over its bar, anchored inward at the chart's two ends.
function tipAt(index: number, count: number): Style {
	if (index < EDGE_SLOTS) return [tip.host, tip.above, tip.start]
	if (index >= count - EDGE_SLOTS) return [tip.host, tip.above, tip.end]
	return [tip.host, tip.above]
}

// The days of the chart, oldest first, each with its name and its count.
type Day = { name: string; count: number; isNamed: boolean }

function daysOf(counts: readonly number[], now: number): Day[] {
	const last = counts.length - 1
	return counts.map((count, index) => ({
		name:
			index === last
				? 'Today'
				: SHORT_DATE.format(dayStartBefore(now, last - index)),
		count,
		isNamed: (last - index) % LABEL_EVERY === 0,
	}))
}

// The figures behind the drawing, for a screen reader (which skips the drawing).
function DaysTable({ days }: { days: readonly Day[] }): ReactElement {
	return (
		<table {...stylex.props(a11y.srOnly)}>
			<caption>Rounds sent per day</caption>
			<tbody>
				{days.map(day => (
					<tr key={day.name}>
						<th scope="row">{day.name}</th>
						<td>{day.count}</td>
					</tr>
				))}
			</tbody>
		</table>
	)
}

// Rounds sent per day, oldest left, today right, growing from the baseline as the chart
// enters. Each day names itself and its count over its bar on hover; today's carries its
// number.
export function RoundsChart({
	counts,
	now,
}: {
	counts: readonly number[]
	now: number
}): ReactElement {
	const max = Math.max(1, ...counts)
	const days = daysOf(counts, now)
	return (
		<>
			<div {...stylex.props(roundsChart.plot)} aria-hidden="true">
				{days.map((day, index) => (
					<span
						key={day.name}
						data-tip={`${day.name} · ${plural(day.count, 'round')}`}
						{...stylex.props(
							roundsChart.slot,
							tipAt(index, days.length),
							slotMarker,
						)}
					>
						<span
							data-enter="growUp"
							{...stylex.props(
								roundsChart.bar,
								!day.count && roundsChart.barZero,
								roundsChart.height(day.count / max),
							)}
						>
							{index === days.length - 1 && (
								<span {...stylex.props(roundsChart.label)}>
									{day.count}
								</span>
							)}
						</span>
					</span>
				))}
			</div>
			<div {...stylex.props(roundsChart.axis)} aria-hidden="true">
				{days.map(day => (
					<span key={day.name}>{day.isNamed ? day.name : ''}</span>
				))}
			</div>
			<DaysTable days={days} />
		</>
	)
}
