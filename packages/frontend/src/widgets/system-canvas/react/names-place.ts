import { overlaps } from './chip-box'

import type { ScreenPoint, Size } from '../projection/camera'
import type { Box } from './chip-box'

// Where the parts' names go on a raised drawing. A name floats over the middle of its block (under it, when it hangs; a plaque under its platform's corner), but blocks seen in a row put their names on top of each other: the nearest names keep their place, and a farther one that would cover a name already placed steps away from its block (up over a standing one, down under a hanging one) until it clears every one of them.

export type NameSpot = { at: ScreenPoint; isUnder: boolean; size: Size }

// An under-hung name's gap under its point (projection.styles' under), and the air kept between two names.
const UNDER_GAP = 4
const AIR = 2
const HALF = 0.5

export function nameBox(spot: NameSpot, lift: number): Box {
	const { at, size } = spot
	return {
		x: at.x - size.width * HALF,
		y: (spot.isUnder ? at.y + UNDER_GAP : at.y - size.height) + lift,
		width: size.width,
		height: size.height,
	}
}

// How far the name steps to clear the boxes placed before it: none when nothing covers it.
function liftFor(spot: NameSpot, placed: readonly Box[]): number {
	let lift = 0
	// Every step clears one more box, always the same way, so a step per box and a last look always suffice.
	for (let step = 0; step <= placed.length; step++) {
		const box = nameBox(spot, lift)
		const hit = placed.find(other => overlaps(box, other))
		if (!hit) return lift
		lift += spot.isUnder
			? hit.y + hit.height + AIR - box.y
			: hit.y - AIR - (box.y + box.height)
	}
	return lift
}

// Each name with its step away from its block and its stacking (a nearer name over a farther one), in the order given; the nearest (the deepest) are placed first.
export function placeNames<T extends NameSpot>(
	spots: readonly T[],
): (T & { lift: number; rank: number })[] {
	const nearestFirst = spots.toSorted((a, b) => b.at.depth - a.at.depth)
	const placed: Box[] = []
	const lifts = new Map<T, number>()
	for (const spot of nearestFirst) {
		const lift = liftFor(spot, placed)
		lifts.set(spot, lift)
		placed.push(nameBox(spot, lift))
	}
	return spots.map(spot => ({
		...spot,
		lift: lifts.get(spot) ?? 0,
		rank: spots.length - 1 - nearestFirst.indexOf(spot),
	}))
}
