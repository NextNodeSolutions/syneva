import * as stylex from '@stylexjs/stylex'

import { circuitRoute } from './circuit-route.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement, RefObject } from 'react'

// The petrol route from one station to the next, drawing itself along its length as it enters.
// `hasEntrance` makes the route one of its row's entrances (it fades in among the stations).
export function RouteArrow({
	css,
	hasEntrance = false,
}: {
	css: Style
	hasEntrance?: boolean
}): ReactElement {
	return (
		<span
			{...stylex.props(circuitRoute.route, css)}
			aria-hidden="true"
			data-enter={hasEntrance ? 'fade' : undefined}
		>
			<span {...stylex.props(circuitRoute.routeLine)} data-enter="grow" />
			<svg {...stylex.props(circuitRoute.routeHead)} viewBox="0 0 10 10">
				<path d="M3 1.5 7 5l-4 3.5" />
			</svg>
		</span>
	)
}

// The next round's way back, under the stations: a dotted rule from the last station's foot
// round to the first's, arriving on an arrowhead.
export function ReturnArrow({
	css,
	pathRef,
}: {
	css: Style
	pathRef?: RefObject<HTMLDivElement | null>
}): ReactElement {
	return (
		<div
			ref={pathRef}
			{...stylex.props(circuitRoute.return, css)}
			aria-hidden="true"
			data-enter="fade"
		>
			<svg
				{...stylex.props(circuitRoute.returnLine)}
				viewBox="0 0 100 20"
				preserveAspectRatio="none"
			>
				<path d="M100 0V20H0V0" vectorEffect="non-scaling-stroke" />
			</svg>
			<svg {...stylex.props(circuitRoute.returnHead)} viewBox="0 0 10 10">
				<path d="M1.5 6.5 5 3l3.5 3.5" />
			</svg>
		</div>
	)
}
