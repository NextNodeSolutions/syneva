import { useRef } from 'react'

import { desksOfTurn } from '@entities/hub/turn'
import { useFlip } from '@shared/lib/use-flip'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { circuitReturn } from './circuit-return.styles'
import { circuit } from './circuit.styles'
import { Station } from './station'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'
import type { FlipRoute, Place } from '@shared/lib/use-flip'
import type { ReactElement, RefObject } from 'react'

// Half a square (circuit.token, 9px): a square runs centred on the dotted rule.
const TOKEN_HALF = 4.5

type ReturnFrame = { band: Element | null; path: HTMLElement | null }

// A square going back round the circuit (from Sent to the agent, leftwards) takes the dotted
// return drawn under the stations instead of crossing them, along its bottom rule; every other
// move is straight, a square reordered inside its own station too. Phones draw no return: there
// the square goes straight as well.
function aroundTheReturn(
	from: Place,
	to: Place,
	{ band, path }: ReturnFrame,
): readonly Place[] {
	if (from.group === to.group || to.x >= from.x) return []
	if (!band || !path || path.offsetParent === null) return []
	const rule =
		path.getBoundingClientRect().bottom - band.getBoundingClientRect().top
	const depth = rule - TOKEN_HALF
	return [
		{ x: from.x, y: depth },
		{ x: to.x, y: depth },
	]
}

function Route(): ReactElement {
	return (
		<span
			{...stylex.props(circuit.route)}
			aria-hidden="true"
			data-enter="fade"
		>
			<span {...stylex.props(circuit.routeLine)} data-enter="grow" />
			<svg {...stylex.props(circuit.routeHead)} viewBox="0 0 10 10">
				<path d="M3 1.5 7 5l-4 3.5" />
			</svg>
		</span>
	)
}

function ReturnPath({
	pathRef,
}: {
	pathRef: RefObject<HTMLDivElement | null>
}): ReactElement {
	return (
		<div
			ref={pathRef}
			{...stylex.props(circuitReturn.path)}
			aria-hidden="true"
			data-enter="fade"
		>
			<svg
				{...stylex.props(circuitReturn.line)}
				viewBox="0 0 100 20"
				preserveAspectRatio="none"
			>
				<path d="M100 0V20H0V0" vectorEffect="non-scaling-stroke" />
			</svg>
			<svg {...stylex.props(circuitReturn.head)} viewBox="0 0 10 10">
				<path d="M1.5 6.5 5 3l3.5 3.5" />
			</svg>
		</div>
	)
}

// The desks off the circuit (no agent attached, or no changes yet), named at its foot; a
// toggle like a station's.
function IdleToggle({
	count,
	isSelected,
	onToggle,
}: {
	count: number
	isSelected: boolean
	onToggle: () => void
}): ReactElement | null {
	if (!count) return null
	return (
		<button
			type="button"
			aria-pressed={isSelected}
			onClick={onToggle}
			{...stylex.props(
				focus.ring,
				circuitReturn.idle,
				isSelected && circuitReturn.idleOn,
			)}
		>
			<LiveDot />
			{count} idle
		</button>
	)
}

type CircuitBandProps = {
	desks: readonly HubDesk[]
	station: Turn | null
	// False while the hub does not answer: whether anything is live is then unknown.
	isLive: boolean
	onSelect: (station: Turn | null) => void
}

// The circuit's squares travel between stations, back round by the return drawn under them:
// FLIP over the band, routed by the return's element (whose ref this hands out).
function useCircuitFlip(
	band: RefObject<HTMLElement | null>,
): RefObject<HTMLDivElement | null> {
	const returnPath = useRef<HTMLDivElement>(null)
	// Read when a move plays (in useFlip's layout effect), never during the render.
	const route: FlipRoute = (from, to) =>
		aroundTheReturn(from, to, {
			band: band.current,
			path: returnPath.current,
		})
	useFlip(band, route)
	return returnPath
}

// The circuit at the head of the overview: whose turn it is on every desk, as the review loop
// runs (your agent, you, sent, and back round to the agent). Choosing a station narrows the
// list under it to that turn; the desks off the circuit (idle) are named at its foot.
export function CircuitBand({
	desks,
	station,
	isLive,
	onSelect,
}: CircuitBandProps): ReactElement {
	const band = useRef<HTMLElement>(null)
	const returnPath = useCircuitFlip(band)
	// Choosing the selected station again shows every turn.
	const toggle = (turn: Turn): void => {
		if (turn === station) onSelect(null)
		else onSelect(turn)
	}
	const stationOf = (turn: Turn): ReactElement => (
		<Station
			turn={turn}
			desks={desksOfTurn(desks, turn)}
			isSelected={station === turn}
			isLive={isLive}
			onSelect={toggle}
		/>
	)
	return (
		<section
			ref={band}
			aria-label="Where each round stands"
			{...stylex.props(circuit.band)}
		>
			<div {...stylex.props(circuit.stations)}>
				{stationOf('agent')}
				<Route />
				{stationOf('yours')}
				<Route />
				{stationOf('sent')}
			</div>
			<ReturnPath pathRef={returnPath} />
			<div {...stylex.props(circuitReturn.foot)} data-enter="fade">
				<p {...stylex.props(circuitReturn.caption)}>
					Next round: the agent reloads, and what it did not touch
					keeps your verdict.
				</p>
				<IdleToggle
					count={desksOfTurn(desks, 'idle').length}
					isSelected={station === 'idle'}
					onToggle={() => toggle('idle')}
				/>
			</div>
		</section>
	)
}
