import type { Point } from '@shared/lib/graph-layout'

const HEAD_LENGTH = 7
const HEAD_HALF = 3.5
// The last leg runs from the second-to-last point to the tip.
const LEG_START = 2

// The arrowhead at the route's end, pointing along its last leg.
export function arrowHead(points: readonly Point[]): string | undefined {
	const tip = points.at(-1)
	const from = points.at(-LEG_START)
	if (!tip || !from) return undefined
	const length = Math.hypot(tip.x - from.x, tip.y - from.y) || 1
	const ux = (tip.x - from.x) / length
	const uy = (tip.y - from.y) / length
	const bx = tip.x - ux * HEAD_LENGTH
	const by = tip.y - uy * HEAD_LENGTH
	return `M${tip.x} ${tip.y}L${bx - uy * HEAD_HALF} ${by + ux * HEAD_HALF}L${bx + uy * HEAD_HALF} ${by - ux * HEAD_HALF}Z`
}
