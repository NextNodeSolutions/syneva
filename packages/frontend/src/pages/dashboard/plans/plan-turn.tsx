import { turnOf } from '@entities/hub/turn'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { TURN_COPY } from '../overview/turn-copy'

import { planLibrary } from './plan-library.styles'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'

// An idle plan desk is one no agent listens on: the plan waits for its agent, not for a diff.
const IDLE_LABEL = 'No agent'

// Where the plan's review stands, in the words every other display uses for a desk's turn, and
// how much of it the reviewer has decided; a plan with no live desk says its desk is closed.
export function PlanTurn({
	desk,
}: {
	desk: HubDesk | undefined
}): ReactElement {
	if (!desk)
		return (
			<span {...stylex.props(planLibrary.turn)}>
				<span {...stylex.props(planLibrary.turnLabel)}>
					<LiveDot hollow />
					No desk open
				</span>
			</span>
		)
	const turn = turnOf(desk)
	const copy = TURN_COPY[turn]
	return (
		<span {...stylex.props(planLibrary.turn)}>
			<span {...stylex.props(planLibrary.turnLabel)}>
				<LiveDot
					tone={copy.dot.tone}
					hollow={copy.dot.isHollow}
					live={copy.dot.isLive}
				/>
				{turn === 'idle' ? IDLE_LABEL : copy.heading}
			</span>
			<span {...stylex.props(planLibrary.decided)}>
				{`${String(desk.decidedChanges)}/${String(desk.totalChanges)} decided`}
			</span>
		</span>
	)
}
