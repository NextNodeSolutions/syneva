import { useCountUp } from '@shared/lib/use-count-up'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { TURN_COPY } from '../turn-copy'

import { circuit } from './circuit.styles'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'
import type { ReactElement } from 'react'

// A station shows a square per desk up to this many; past it, the rest are a count.
const MAX_TOKENS = 14

const TOKEN_LOOK: Record<Turn, stylex.StyleXStyles> = {
	yours: null,
	agent: circuit.tokenWorking,
	sent: circuit.tokenSent,
	idle: null,
}

// One square per desk standing at the station, each keyed for its travel to the next one.
function StationTokens({
	turn,
	desks,
}: {
	turn: Turn
	desks: readonly HubDesk[]
}): ReactElement {
	const shown = desks.slice(0, MAX_TOKENS)
	return (
		<span {...stylex.props(circuit.tokens)} aria-hidden="true">
			{shown.map(desk => (
				<span
					key={desk.id}
					data-flip={desk.id}
					data-flip-group={turn}
					title={desk.session}
					{...stylex.props(circuit.token, TOKEN_LOOK[turn])}
				/>
			))}
			{desks.length > shown.length && (
				<span {...stylex.props(circuit.more)}>
					+{desks.length - shown.length}
				</span>
			)}
		</span>
	)
}

type StationProps = {
	turn: Turn
	desks: readonly HubDesk[]
	isSelected: boolean
	isLive: boolean
	onSelect: (turn: Turn) => void
}

// One station of the circuit: its turn, how many desks stand there (ticking when it changes),
// and a square per desk, which travels to its next station when the desk's turn moves on. A
// button: choosing it narrows the list under the circuit to its desks (again to undo).
export function Station({
	turn,
	desks,
	isSelected,
	isLive,
	onSelect,
}: StationProps): ReactElement {
	const copy = TURN_COPY[turn]
	const count = useCountUp(desks.length)
	const phrase = copy.phrase(desks.length)
	return (
		<button
			type="button"
			aria-pressed={isSelected}
			aria-label={`${copy.station}: ${desks.length} ${phrase}`}
			data-enter="rise"
			onClick={() => onSelect(turn)}
			{...stylex.props(
				focus.ring,
				circuit.station,
				turn === 'yours' && desks.length > 0 && circuit.stationWaiting,
				isSelected && circuit.stationOn,
			)}
		>
			<span {...stylex.props(circuit.label)}>
				<LiveDot
					tone={copy.dot.tone}
					hollow={copy.dot.isHollow}
					live={isLive && copy.dot.isLive && desks.length > 0}
				/>
				{copy.station}
			</span>
			<span {...stylex.props(circuit.countRow)} aria-hidden="true">
				<span
					{...stylex.props(
						circuit.count,
						!desks.length && circuit.countZero,
					)}
				>
					{count}
				</span>
				<span {...stylex.props(circuit.phrase)}>{phrase}</span>
			</span>
			<StationTokens turn={turn} desks={desks} />
		</button>
	)
}
