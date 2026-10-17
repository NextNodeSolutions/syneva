import { coverOf, isInside, overlaps } from './chip-box'
import { wordsSize } from './chip-size'

import type { ScreenPoint, Size } from '../projection/camera'
import type { Box } from './chip-box'

// Where the links' words go on a raised drawing. ELK placed each label for the plan, where nothing floats; raised, the parts' names float over the blocks, the tiers paint the domains' plates on the fronts, the decks' names stand at their corners, and two links' words can meet. A link's words take the first stretch of its route that none of them covers, and that no words placed before them take: ELK's point first, then the middle of each leg, the longest leg first, then every eighth of the way along each, the nearest the middle first. Where no stretch is free, a step keeps its number, which takes the least room, and the words go unsaid; the inspector under the drawing lists every step whole. Words the reviewer is looking at (a link of the part they point at) are placed first and always said, beside their route when no stretch of it is free.

export type WordsSpot = {
	preferred: ScreenPoint
	// The route as the camera sees it.
	points: readonly ScreenPoint[]
	// The words it says, empty when it only shows its number.
	text: string
	hasNumber: boolean
	isLooked: boolean
}

export type WordsPlace = { at: ScreenPoint; hasWords: boolean }

const HALF = 0.5
// The stops along a leg besides its middle, every eighth of the way, the nearest the middle first.
const EIGHTHS = 8
const STOPS = Array.from(
	{ length: EIGHTHS - 1 },
	(_, index) => (index + 1) / EIGHTHS,
)
	.filter(t => t !== HALF)
	.toSorted((a, b) => Math.abs(a - HALF) - Math.abs(b - HALF))

function along(from: ScreenPoint, to: ScreenPoint, t: number): ScreenPoint {
	return {
		x: from.x + (to.x - from.x) * t,
		y: from.y + (to.y - from.y) * t,
		depth: from.depth + (to.depth - from.depth) * t,
	}
}

function candidatesOf(spot: WordsSpot): ScreenPoint[] {
	const legs = spot.points
		.slice(1)
		.map((to, index) => ({ from: spot.points[index] ?? to, to }))
		.toSorted(
			(a, b) =>
				Math.hypot(b.to.x - b.from.x, b.to.y - b.from.y) -
				Math.hypot(a.to.x - a.from.x, a.to.y - a.from.y),
		)
	return [
		spot.preferred,
		...legs.map(leg => along(leg.from, leg.to, HALF)),
		...STOPS.flatMap(t => legs.map(leg => along(leg.from, leg.to, t))),
	]
}

function boxAt(at: ScreenPoint, size: Size): Box {
	return {
		x: at.x - size.width * HALF,
		y: at.y - size.height * HALF,
		width: size.width,
		height: size.height,
	}
}

type Room = { taken: readonly Box[]; field: Size }

function freeAt(
	candidates: readonly ScreenPoint[],
	size: Size,
	room: Room,
): ScreenPoint | undefined {
	return candidates.find(at => {
		const box = boxAt(at, size)
		return (
			isInside(box, room.field) &&
			!room.taken.some(other => overlaps(box, other))
		)
	})
}

function leastCovered(
	candidates: readonly ScreenPoint[],
	size: Size,
	room: Room,
): ScreenPoint {
	const cover = (at: ScreenPoint): number =>
		coverOf(boxAt(at, size), room.taken)
	return candidates.reduce((best, at) =>
		cover(at) < cover(best) ? at : best,
	)
}

// Words that must show (a step's number, the words the reviewer looks at) with no free stop on their route: the same stops, their height or width aside (over, under, either side, then the corners of each stop in turn), before they settle over a name.
const AIR = 2
const RING = [
	[0, -1],
	[0, 1],
	[-1, 0],
	[1, 0],
	[-1, -1],
	[1, -1],
	[-1, 1],
	[1, 1],
] as const

function aside(candidates: readonly ScreenPoint[], size: Size): ScreenPoint[] {
	const across = size.width + AIR
	const down = size.height + AIR
	return candidates.flatMap(at =>
		RING.map(([dx, dy]) => ({
			depth: at.depth,
			x: at.x + dx * across,
			y: at.y + dy * down,
		})),
	)
}

function placeOne(spot: WordsSpot, room: Room): WordsPlace | undefined {
	const candidates = candidatesOf(spot)
	const full = wordsSize(spot.text, spot.hasNumber)
	const free = freeAt(candidates, full, room)
	if (free) return { at: free, hasWords: Boolean(spot.text) }
	if (spot.isLooked)
		return {
			at:
				freeAt(aside(candidates, full), full, room) ??
				leastCovered(candidates, full, room),
			hasWords: true,
		}
	if (!spot.hasNumber) return undefined
	const number = wordsSize('', true)
	return {
		at:
			freeAt(candidates, number, room) ??
			freeAt(aside(candidates, number), number, room) ??
			leastCovered(candidates, number, room),
		hasWords: false,
	}
}

// Each spot's place, in the order given (the first placed have the pick); none for words with no free stretch and nothing they must show.
export function placeWords(
	spots: readonly WordsSpot[],
	room: Room,
): (WordsPlace | undefined)[] {
	const taken = [...room.taken]
	return spots.map(spot => {
		const place = placeOne(spot, { taken, field: room.field })
		if (place)
			taken.push(
				boxAt(
					place.at,
					wordsSize(place.hasWords ? spot.text : '', spot.hasNumber),
				),
			)
		return place
	})
}
