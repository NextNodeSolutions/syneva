import type { Size } from '../projection/camera'

// A chip's box on the field, in pixels from its top left corner.
export type Box = { x: number; y: number; width: number; height: number }

export function overlaps(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	)
}

// How much of a box others cover, counted once per box.
export function coverOf(box: Box, others: readonly Box[]): number {
	return others.reduce((sum, other) => {
		const across =
			Math.min(box.x + box.width, other.x + other.width) -
			Math.max(box.x, other.x)
		const down =
			Math.min(box.y + box.height, other.y + other.height) -
			Math.max(box.y, other.y)
		return sum + Math.max(0, across) * Math.max(0, down)
	}, 0)
}

export function isInside(box: Box, field: Size): boolean {
	return (
		box.x >= 0 &&
		box.y >= 0 &&
		box.x + box.width <= field.width &&
		box.y + box.height <= field.height
	)
}
