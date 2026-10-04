import { loopLabelAt, routeWire } from './circuit-routing'

import type { Point, Route } from './circuit-routing'

// The circuit on its wide frame: the source and verdict stations at either
// end of one row, the review platform between them. The platforms draw their
// ports from this table and the wires between the ports are routed from it at
// build time, so the markup is the finished pose; the runtime re-routes them
// from the live layout (circuit-wires.ts).
export const ROW = 312
export const PLATFORM_X = { source: 212, review: 580, verdict: 948 } as const

type Platform = keyof typeof PLATFORM_X
type Port = {
	readonly platform: Platform
	readonly x: number
	readonly y: number
}

// Each port, relative to its platform's centre: the forward wires leave and
// reach the platforms' side corners, the return docks under the stations' rims.
const PORTS = {
	'agent-out': { platform: 'source', x: 124, y: 0 },
	'agent-return': { platform: 'source', x: 0, y: 69 },
	'review-in': { platform: 'review', x: -152, y: 0 },
	'review-out': { platform: 'review', x: 152, y: 0 },
	'verdict-in': { platform: 'verdict', x: -124, y: 0 },
	'verdict-return': { platform: 'verdict', x: 0, y: 69 },
} as const satisfies Record<string, Port>
type PortId = keyof typeof PORTS

export const portsOn = (platform: Platform): [string, Port][] =>
	Object.entries(PORTS).filter(([, port]) => port.platform === platform)

const pointOf = (id: PortId): Point => {
	const { platform, x, y } = PORTS[id]
	return { x: PLATFORM_X[platform] + x, y: ROW + y }
}

type Wire = {
	readonly id: string
	readonly from: PortId
	readonly to: PortId
	readonly route: Route
}

const RETURN_WIRE = {
	id: 'flow-return',
	from: 'verdict-return',
	to: 'agent-return',
	route: 'return',
} as const satisfies Wire

const routed = (wire: Wire): Wire & { readonly d: string } => ({
	...wire,
	d: routeWire(wire.route, pointOf(wire.from), pointOf(wire.to)),
})

export const WIRES = [
	routed({
		id: 'flow-in',
		from: 'agent-out',
		to: 'review-in',
		route: 'forward',
	}),
	routed({
		id: 'flow-out',
		from: 'review-out',
		to: 'verdict-in',
		route: 'forward',
	}),
	routed(RETURN_WIRE),
]

export const LOOP_LABEL = loopLabelAt(
	pointOf(RETURN_WIRE.from),
	pointOf(RETURN_WIRE.to),
)
