import { isTier, placeOf } from '../layout/tiers'

import { NUMBER_ROOM } from './face-frame'
import {
	blockOf,
	holdersOf,
	ledgeOf,
	slabOf,
	TIER_LEDGE,
	zoneOf,
	zonePad,
} from './tier-solids'
import { TIER_BLOCK, tierSpots } from './tier-spots'

import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { RaisedPart } from './raised'
import type { Solid } from './solids'
import type { Spot, TierSpots } from './tier-spots'

// The scene stood on its tiers: one floor per tier it has parts on, each holding its parts and the zones of the containers around them, the rim parts on ledges beside their floor. Every coordinate is moved right so nothing lies left of 0.

export type TierFloor = {
	id: string
	name: string
	slabs: Solid[]
	parts: RaisedPart[]
}

export type TierPlan = {
	floors: TierFloor[]
	// Where a link starts or ends for each part: its block, or a container's highest zone.
	ends: Map<string, Solid>
	width: number
	// The floors' front edge, where the drops between them run.
	depth: number
	top: number
}

function partOf(
	solid: Solid,
	element: RaisedPart['element'],
	level: number,
): RaisedPart {
	return {
		key: solid.id,
		solid,
		element,
		mark: element.change,
		level,
		isQuiet: false,
		isNamed: true,
		isNumbered:
			!solid.isPlatform &&
			solid.top - solid.base >= NUMBER_ROOM &&
			Boolean(element.domains?.length),
	}
}

// Room left of the floors for their names.
const PLAQUE_ROOM = 120

// Every spot moved right by the same amount, so the leftmost ledge starts at 0 and the floors' names have room before them.
function shifted(frame: TierSpots): {
	spots: Spot[]
	left: number
	width: number
} {
	const all = [...frame.spots.values()]
	const low = Math.min(
		frame.left - PLAQUE_ROOM,
		...all.map(spot => spot.x - TIER_LEDGE),
	)
	const high = Math.max(
		frame.right,
		...all.map(spot => spot.x + TIER_BLOCK.width + TIER_LEDGE),
	)
	return {
		spots: all.map(spot => ({
			id: spot.id,
			floor: spot.floor,
			x: spot.x - low,
			y: spot.y,
		})),
		left: frame.left - low,
		width: high - low,
	}
}

type Placed = {
	spot: Spot
	solid: Solid
	element: RaisedPart['element']
	isRim: boolean
}

type Zone = { floor: number; part: RaisedPart }

// One container's zones, one per floor it has parts on; its name goes on the highest.
function zonesOf(
	scene: Scene,
	holder: string,
	placed: readonly Placed[],
): Zone[] {
	const element = scene.elements.get(holder)
	if (!element) return []
	const inside = placed.filter(
		entry =>
			!entry.isRim && holdersOf(scene, entry.spot.id).includes(holder),
	)
	const floors = [...new Set(inside.map(entry => entry.spot.floor))]
	const highest = Math.max(...floors)
	const depth = holdersOf(scene, holder).length
	return floors.map(floor => {
		const solid = zoneOf(
			{ holder, floor, depth, pad: zonePad(scene, holder) },
			inside
				.filter(entry => entry.spot.floor === floor)
				.map(entry => entry.solid),
		)
		return {
			floor,
			part: {
				...partOf(solid, element, depth),
				isNamed: floor === highest,
			},
		}
	})
}

function placedParts(scene: Scene, spots: readonly Spot[]): Placed[] {
	return spots.flatMap(spot => {
		const element = scene.elements.get(spot.id)
		if (!element) return []
		const isRim = !isTier(placeOf(element))
		const zones = isRim ? 0 : holdersOf(scene, spot.id).length
		return [{ spot, solid: blockOf(spot, element, zones), element, isRim }]
	})
}

// One floor: its slab under the floors' common footprint and the ledges of its rim parts, then the zones and the blocks on it.
function floorOf(
	entry: TierSpots['floors'][number],
	floor: number,
	footprint: Pick<Solid, 'x' | 'y' | 'width' | 'length'>,
	contents: { placed: readonly Placed[]; zones: readonly Zone[] },
): TierFloor {
	const here = contents.placed.filter(spot => spot.spot.floor === floor)
	const id = `floor:${entry.tier}`
	return {
		id,
		name: entry.name,
		slabs: [
			slabOf(id, footprint, floor),
			...here.filter(spot => spot.isRim).map(spot => ledgeOf(spot.spot)),
		],
		parts: [
			...contents.zones
				.filter(zone => zone.floor === floor)
				.map(zone => zone.part),
			...here.map(spot => partOf(spot.solid, spot.element, 0)),
		],
	}
}

function holdersIn(scene: Scene): Set<string> {
	return new Set(
		[...scene.elements.values()].flatMap(element =>
			element.parent && scene.elements.has(element.parent)
				? [element.parent]
				: [],
		),
	)
}

export function tierPlan(scene: Scene, layout: CanvasLayout): TierPlan {
	const holders = holdersIn(scene)
	const leaves = [...scene.elements.keys()].filter(id => !holders.has(id))
	const frame = tierSpots(scene, layout, leaves)
	const moved = shifted(frame)
	const placed = placedParts(scene, moved.spots)
	const zones = [...holders].flatMap(holder => zonesOf(scene, holder, placed))
	const ends = new Map(placed.map(entry => [entry.spot.id, entry.solid]))
	for (const zone of zones) ends.set(zone.part.element.id, zone.part.solid)
	const footprint = {
		x: moved.left,
		y: 0,
		width: frame.right - frame.left,
		length: frame.depth,
	}
	return {
		floors: frame.floors.map((entry, floor) =>
			floorOf(entry, floor, footprint, { placed, zones }),
		),
		ends,
		width: moved.width,
		depth: frame.depth,
		top: Math.max(0, ...placed.map(entry => entry.solid.top)),
	}
}
