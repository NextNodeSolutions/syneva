import type { Point } from '@shared/lib/graph-layout'
import type { CanvasLayout } from '../layout/canvas-layout'
import type { Point3 } from './camera'

// The plan raised into volumes: a container is a platform its parts stand on, one step above the platform that holds it; an element is a block standing on the platform under it. Links run over the ground they cross and climb a platform's rim where they enter it.

// A platform's thickness and a block's height, in the layout's pixels. A platform stays thin enough that a link ELK keeps clear of its rim never seems to cross it.
export const PLATFORM = 8
export const BLOCK = 26

export type Solid = {
	id: string
	isPlatform: boolean
	// The footprint on the floor, in the layout's root frame.
	x: number
	y: number
	width: number
	length: number
	base: number
	top: number
}

export type Route = {
	id: string
	points: Point3[]
	// Where the link's words sit, on the ground under ELK's label box.
	label?: Point3 | undefined
}

const MIDDLE = 0.5

export function solidsOf(layout: CanvasLayout): Solid[] {
	const placed = new Map<string, Solid>()
	for (const box of layout.boxes) {
		const parent = box.parent ? placed.get(box.parent) : undefined
		const base = parent?.top ?? 0
		placed.set(box.id, {
			id: box.id,
			isPlatform: box.isGroup,
			x: (parent?.x ?? 0) + box.x,
			y: (parent?.y ?? 0) + box.y,
			width: box.width,
			length: box.height,
			base,
			top: base + (box.isGroup ? PLATFORM : BLOCK),
		})
	}
	return [...placed.values()]
}

function holds(solid: Solid, point: Point): boolean {
	return (
		point.x > solid.x &&
		point.x < solid.x + solid.width &&
		point.y > solid.y &&
		point.y < solid.y + solid.length
	)
}

// The height of the ground at a point: the top of the highest platform under it.
function groundAt(platforms: readonly Solid[], point: Point): number {
	return Math.max(
		0,
		...platforms
			.filter(platform => holds(platform, point))
			.map(platform => platform.top),
	)
}

function at(from: Point, to: Point, t: number): Point {
	return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}

// Where along a leg (0 to 1, ends excluded) it meets a line x = edge or y = edge.
function axisHits(from: number, to: number, edges: number[]): number[] {
	const span = to - from
	if (!span) return []
	return edges.map(edge => (edge - from) / span).filter(t => t > 0 && t < 1)
}

function rimHits(platform: Solid, from: Point, to: Point): number[] {
	const right = platform.x + platform.width
	const bottom = platform.y + platform.length
	return [
		...axisHits(from.x, to.x, [platform.x, right]).filter(t => {
			const { y } = at(from, to, t)
			return y >= platform.y && y <= bottom
		}),
		...axisHits(from.y, to.y, [platform.y, bottom]).filter(t => {
			const { x } = at(from, to, t)
			return x >= platform.x && x <= right
		}),
	]
}

// One leg cut at every rim it crosses, each piece on the ground under its middle, with a vertical step where the ground changes.
function raisedLeg(
	platforms: readonly Solid[],
	from: Point,
	to: Point,
): Point3[] {
	const cuts = [
		0,
		...new Set(platforms.flatMap(platform => rimHits(platform, from, to))),
		1,
	].toSorted((a, b) => a - b)
	const grounds = cuts
		.slice(1)
		.map((cut, index) =>
			groundAt(
				platforms,
				at(from, to, ((cuts[index] ?? 0) + cut) * MIDDLE),
			),
		)
	return cuts.flatMap((cut, index) => {
		const { x, y } = at(from, to, cut)
		const before = grounds[index - 1] ?? grounds[index] ?? 0
		const after = grounds[index] ?? before
		return before === after
			? [{ x, y, z: before }]
			: [
					{ x, y, z: before },
					{ x, y, z: after },
				]
	})
}

export function routesOf(
	layout: CanvasLayout,
	solids: readonly Solid[],
): Route[] {
	const platforms = solids.filter(solid => solid.isPlatform)
	return layout.links.map(laid => {
		const legs = laid.points.slice(1).map((to, index) => {
			const from = laid.points[index] ?? to
			return raisedLeg(platforms, from, to)
		})
		const centre = laid.label && {
			x: laid.label.x + laid.label.width * MIDDLE,
			y: laid.label.y + laid.label.height * MIDDLE,
		}
		return {
			id: laid.id,
			// A leg starts where the one before it ended.
			points: legs.flatMap((leg, index) => (index ? leg.slice(1) : leg)),
			label: centre && { ...centre, z: groundAt(platforms, centre) },
		}
	})
}
