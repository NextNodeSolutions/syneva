import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

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

function Route(): ReactElement {
	return (
		<span {...stylex.props(loopDiagram.route)}>
			<span {...stylex.props(loopDiagram.routeLine)} data-enter="grow" />
			<svg {...stylex.props(loopDiagram.routeHead)} viewBox="0 0 10 10">
				<path d="M3 1.5 7 5l-4 3.5" />
			</svg>
		</span>
	)
}

// The review loop at rest: how a desk goes round, before any desk does. A picture: what it
// says is said again in the page's words, so it is hidden from assistive technology.
export function LoopDiagram(): ReactElement {
	const [agent, you, sent] = STOPS
	return (
		<figure
			{...stylex.props(loopDiagram.figure)}
			aria-hidden="true"
			data-enter="fade"
		>
			<div {...stylex.props(loopDiagram.stations)}>
				{agent && <StopTile stop={agent} />}
				<Route />
				{you && <StopTile stop={you} />}
				<Route />
				{sent && <StopTile stop={sent} />}
			</div>
			<div {...stylex.props(loopDiagram.back)} data-enter="fade">
				<svg
					{...stylex.props(loopDiagram.backLine)}
					viewBox="0 0 100 20"
					preserveAspectRatio="none"
				>
					<path d="M100 0V20H0V0" vectorEffect="non-scaling-stroke" />
				</svg>
				<svg
					{...stylex.props(loopDiagram.backHead)}
					viewBox="0 0 10 10"
				>
					<path d="M1.5 6.5 5 3l3.5 3.5" />
				</svg>
			</div>
		</figure>
	)
}
