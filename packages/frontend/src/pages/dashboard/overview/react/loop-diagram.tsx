import { Fragment } from 'react'

import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { ReturnArrow, RouteArrow } from './circuit-route'
import { circuitRoute } from './circuit-route.styles'
import { loopDiagram } from './loop-diagram.styles'

import type { DotTone } from '@shared/ui/live-dot'
import type { ReactElement } from 'react'

type Stop = {
	label: string
	caption: string
	dot: { tone: DotTone; isHollow: boolean }
	isYours: boolean
}

// The loop a desk goes round, in the overview's own words (turn-copy.ts): the agent opens it,
// the reviewer reviews and sends, the agent reloads with the verdicts kept, and back.
const STOPS: readonly Stop[] = [
	{
		label: 'Your agent',
		caption: 'Opens a desk on its changes',
		dot: { tone: 'neutral', isHollow: true },
		isYours: false,
	},
	{
		label: 'You',
		caption: 'Review it, then send the round',
		dot: { tone: 'petrol', isHollow: false },
		isYours: true,
	},
	{
		label: 'Sent',
		caption: 'It reloads; your verdicts stay',
		dot: { tone: 'petrol', isHollow: true },
		isYours: false,
	},
]

function StopTile({ stop }: { stop: Stop }): ReactElement {
	return (
		<div
			data-enter="rise"
			{...stylex.props(
				loopDiagram.station,
				stop.isYours && loopDiagram.stationYou,
			)}
		>
			<span
				{...stylex.props(
					loopDiagram.label,
					stop.isYours && loopDiagram.labelYou,
				)}
			>
				<LiveDot
					tone={stop.dot.tone}
					hollow={stop.dot.isHollow}
					css={loopDiagram.labelDot}
				/>
				{stop.label}
			</span>
			<span {...stylex.props(loopDiagram.caption)}>{stop.caption}</span>
		</div>
	)
}

// The review loop at rest: how a desk goes round, before any desk does. A picture: what it
// says is said again in the page's words, so it is hidden from assistive technology.
export function LoopDiagram(): ReactElement {
	return (
		<figure
			{...stylex.props(circuitRoute.field, loopDiagram.figure)}
			aria-hidden="true"
			data-enter="fade"
		>
			<div {...stylex.props(loopDiagram.stations)}>
				{STOPS.map((stop, index) => (
					<Fragment key={stop.label}>
						{index > 0 && <RouteArrow css={loopDiagram.route} />}
						<StopTile stop={stop} />
					</Fragment>
				))}
			</div>
			<ReturnArrow css={loopDiagram.back} />
		</figure>
	)
}
