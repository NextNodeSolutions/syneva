// The circuit's wire routes, as pure geometry: the same math routes the wide
// frame at build time and the live layout at runtime. A forward wire eases
// across in one S-curve; the return wire drops below the row, runs back
// under it with rounded corners and climbs to its port.
export type Point = { readonly x: number; readonly y: number }
export type Route = 'forward' | 'return'

const MIDPOINT = 0.5
const CLEARANCE = 44
const RADIUS = 16
const LABEL_GAP = 24

const forward = (from: Point, to: Point): string => {
	const middleX = (from.x + to.x) * MIDPOINT
	return `M${from.x} ${from.y}C${middleX} ${from.y} ${middleX} ${to.y} ${to.x} ${to.y}`
}

const bottomOf = (from: Point, to: Point): number =>
	Math.max(from.y, to.y) + CLEARANCE

const returning = (from: Point, to: Point): string => {
	const bottom = bottomOf(from, to)
	return `M${from.x} ${from.y}V${bottom - RADIUS}q0 ${RADIUS} ${-RADIUS} ${RADIUS}H${to.x + RADIUS}q${-RADIUS} 0 ${-RADIUS} ${-RADIUS}V${to.y}`
}

export const routeWire = (route: Route, from: Point, to: Point): string =>
	route === 'return' ? returning(from, to) : forward(from, to)

// The loop label sits under the middle of the return wire's bottom run, its
// midpoint, since both ends of the return share a row.
export const loopLabelAt = (from: Point, to: Point): Point => ({
	x: (from.x + to.x) * MIDPOINT,
	y: bottomOf(from, to) + LABEL_GAP,
})
