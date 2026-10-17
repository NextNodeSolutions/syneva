import type { Point, Rect } from '@shared/lib/graph-layout'
import type { LaidBox, LaidLink } from './canvas-layout'

// ELK sets a link's words beside the last leg of its route, on a side it picks before it routes the other links: a link routed afterwards can run through them, and the words' paper then cuts that line and reads as its words. Such words move to the other side of their own leg when that side is clear (of every line, tile, container head or border, and other words); else they stay where ELK set them.

// A container's head band: the room ELK keeps above its children (canvas-layout's group padding).
const HEAD_BAND = 60
// A line along a box's very edge does not cut it.
const INSET = 1
const DOUBLE = 2

type Segment = { from: Point; to: Point }

function segmentsOf(points: readonly Point[]): Segment[] {
	return points
		.slice(1)
		.map((to, index) => ({ from: points[index] ?? to, to }))
}

function outline(box: Rect): Segment[] {
	const right = box.x + box.width
	const bottom = box.y + box.height
	return segmentsOf([
		{ x: box.x, y: box.y },
		{ x: right, y: box.y },
		{ x: right, y: bottom },
		{ x: box.x, y: bottom },
		{ x: box.x, y: box.y },
	])
}

// Whether an orthogonal segment runs through the inside of a box.
function cuts(segment: Segment, box: Rect): boolean {
	const { from, to } = segment
	return (
		Math.min(from.x, to.x) < box.x + box.width - INSET &&
		Math.max(from.x, to.x) > box.x + INSET &&
		Math.min(from.y, to.y) < box.y + box.height - INSET &&
		Math.max(from.y, to.y) > box.y + INSET
	)
}

function overlaps(a: Rect, b: Rect): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	)
}

type Ground = { solids: Rect[]; borders: Segment[] }

// The boxes in the root frame (a laid box is placed in its parent's): a tile whole, a container by its head band and its dashed border.
function groundOf(boxes: readonly LaidBox[]): Ground {
	const placed = new Map<string, Point>()
	const ground: Ground = { solids: [], borders: [] }
	for (const box of boxes) {
		const parent = box.parent ? placed.get(box.parent) : undefined
		const rect = {
			...box,
			x: (parent?.x ?? 0) + box.x,
			y: (parent?.y ?? 0) + box.y,
		}
		placed.set(box.id, rect)
		ground.solids.push(box.isGroup ? { ...rect, height: HEAD_BAND } : rect)
		if (box.isGroup) ground.borders.push(...outline(rect))
	}
	return ground
}

// The words mirrored across the last leg of their route.
function mirrored(label: Rect, points: readonly Point[]): Rect | undefined {
	const tip = points.at(-1)
	const from = points.at(-DOUBLE)
	if (!tip || !from) return undefined
	if (from.x === tip.x)
		return { ...label, x: DOUBLE * tip.x - label.x - label.width }
	if (from.y === tip.y)
		return { ...label, y: DOUBLE * tip.y - label.y - label.height }
	return undefined
}

type Taken = { lines: Segment[]; ground: Ground; words: (Rect | undefined)[] }

function isClear(moved: Rect, own: readonly Point[], taken: Taken): boolean {
	const lines = [...taken.lines, ...taken.ground.borders, ...segmentsOf(own)]
	return (
		!lines.some(line => cuts(line, moved)) &&
		!taken.ground.solids.some(solid => overlaps(solid, moved)) &&
		!taken.words.some(other => other && overlaps(other, moved))
	)
}

export function clearLabels(
	boxes: readonly LaidBox[],
	links: readonly LaidLink[],
): LaidLink[] {
	const ground = groundOf(boxes)
	const words = links.map(link => link.label)
	return links.map((link, index) => {
		const { label } = link
		const lines = links
			.filter(other => other !== link)
			.flatMap(other => segmentsOf(other.points))
		if (!label || !lines.some(line => cuts(line, label))) return link
		const moved = mirrored(label, link.points)
		const others = words.filter((_, at) => at !== index)
		if (
			!moved ||
			!isClear(moved, link.points, { lines, ground, words: others })
		)
			return link
		words[index] = moved
		return { ...link, label: moved }
	})
}
