import { FLOORS, isTier, placeOf } from '../layout/tiers'

import { solidsOf } from './solids'

import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { Tier } from '../layout/tiers'

// Where each part stands in the tiers, seen from above: its floor, and its footprint's corner on it. A floor lays its parts in rows in the plan's order across the flow, each as near its place in the plan as the part before it allows, so parts that line up in the plan line up from floor to floor and a link between them drops straight. The rim parts stand beside the floor they talk to.

export const TIER_BLOCK = { width: 150, length: 76 } as const
const GAP = 40
export const TIER_MARGIN = 30
const ROW_MAX = 5
const ROW_GAP = 36
const RIM_GAP = 56
const HALF = 0.5
// With no part on any tier (a path between the rim's parts alone), the rim stands beside the services' floor.
const FALLBACK_FLOOR = FLOORS.filter(entry => entry.tier === 'service')

export type Spot = { id: string; floor: number; x: number; y: number }

export type TierSpots = {
	// The floors present, bottom up.
	floors: readonly { tier: Tier; name: string }[]
	spots: Map<string, Spot>
	// The floors' common footprint across x, and their depth from the back edge to the front one.
	left: number
	right: number
	depth: number
}

// A part's centre in the plan on the axis across the links' flow: along x when the plan runs down, along y when it runs across.
function crossOf(layout: CanvasLayout): Map<string, number> {
	return new Map(
		solidsOf(layout).map(solid => [
			solid.id,
			layout.direction === 'DOWN'
				? solid.x + solid.width * HALF
				: solid.y + solid.length * HALF,
		]),
	)
}

function rowY(row: number): number {
	return TIER_MARGIN + row * (TIER_BLOCK.length + ROW_GAP)
}

function floorSpots(
	ids: readonly string[],
	floor: number,
	cross: ReadonlyMap<string, number>,
): Spot[] {
	const at = (id: string): number =>
		(cross.get(id) ?? 0) - TIER_BLOCK.width * HALF
	const edges = new Map<number, number>()
	return ids
		.toSorted((a, b) => at(a) - at(b))
		.map((id, index) => {
			const row = Math.floor(index / ROW_MAX)
			const edge = edges.get(row) ?? -Infinity
			const x = Math.max(at(id), edge + GAP)
			edges.set(row, x + TIER_BLOCK.width)
			return { id, floor, x, y: rowY(row) }
		})
}

// The floor a rim part talks to: that of the first part on a floor it links with, else the top floor.
function homeFloor(scene: Scene, id: string, spots: Map<string, Spot>): number {
	for (const link of scene.links) {
		const partner =
			(link.from === id && link.to) || (link.to === id && link.from)
		const spot = partner ? spots.get(partner) : undefined
		if (spot) return spot.floor
	}
	return Math.max(0, ...[...spots.values()].map(spot => spot.floor))
}

function rimSpots(
	scene: Scene,
	rim: readonly string[],
	frame: TierSpots,
): Spot[] {
	const counts = new Map<string, number>()
	return rim.map(id => {
		const element = scene.elements.get(id)
		const isLeft = element ? placeOf(element) === 'people' : false
		const floor = homeFloor(scene, id, frame.spots)
		const key = `${String(isLeft)}:${String(floor)}`
		const outward = counts.get(key) ?? 0
		counts.set(key, outward + 1)
		const step = outward * (TIER_BLOCK.width + GAP)
		const x = isLeft
			? frame.left - RIM_GAP - TIER_BLOCK.width - step
			: frame.right + RIM_GAP + step
		return { id, floor, x, y: rowY(0) }
	})
}

export function tierSpots(
	scene: Scene,
	layout: CanvasLayout,
	leaves: readonly string[],
): TierSpots {
	const tierOf = (id: string): Tier | undefined => {
		const element = scene.elements.get(id)
		const place = element && placeOf(element)
		if (!place || !isTier(place)) return undefined
		return place
	}
	const present = FLOORS.filter(entry =>
		leaves.some(id => tierOf(id) === entry.tier),
	)
	const floors = present.length ? present : FALLBACK_FLOOR
	const cross = crossOf(layout)
	const placed = floors.flatMap((entry, floor) =>
		floorSpots(
			leaves.filter(id => tierOf(id) === entry.tier),
			floor,
			cross,
		),
	)
	const xs = placed.flatMap(spot => [spot.x, spot.x + TIER_BLOCK.width])
	const back = Math.max(rowY(0), ...placed.map(spot => spot.y))
	const frame: TierSpots = {
		floors,
		spots: new Map(placed.map(spot => [spot.id, spot])),
		left: (xs.length ? Math.min(...xs) : 0) - TIER_MARGIN,
		right: (xs.length ? Math.max(...xs) : TIER_BLOCK.width) + TIER_MARGIN,
		depth: back + TIER_BLOCK.length + TIER_MARGIN,
	}
	const rim = leaves.filter(id => !tierOf(id))
	for (const spot of rimSpots(scene, rim, frame))
		frame.spots.set(spot.id, spot)
	return frame
}
