import { project } from './camera'

import type { Rect } from '@shared/lib/graph-layout'
import type { Camera, Point3, Size } from './camera'
import type { Solid } from './solids'

// A block's front as its own flat frame on the screen: the affine map that lays a point u along the front and v down it where the camera sees it, as an SVG matrix, so marks drawn in the front's units read as painted on it. Exact for the isometric camera, which has no perspective and always sees the fronts.

export type FaceFrame = { matrix: string; width: number; height: number }

// The least height a front needs to carry a row of numbers; a lower block carries them in its name.
export const NUMBER_ROOM = 24

// The domains' plates on a front, in the front's units: the square each is painted in, the step from one to the next, the inset from the front's left edge.
export const PLATE = { square: 22, step: 27, inset: 10 } as const
const HALF = 0.5

type Cells = [number, number, number, number, number, number]

function cellsOf(solid: Solid, view: { camera: Camera; floor: Size }): Cells {
	const seen = (point: Point3): { x: number; y: number } =>
		project(view.camera, view.floor, point)
	const front = solid.y + solid.length
	const height = solid.top - solid.base
	const origin = seen({ x: solid.x, y: front, z: solid.top })
	const along = seen({ x: solid.x + solid.width, y: front, z: solid.top })
	const down = seen({ x: solid.x, y: front, z: solid.base })
	return [
		(along.x - origin.x) / solid.width,
		(along.y - origin.y) / solid.width,
		(down.x - origin.x) / height,
		(down.y - origin.y) / height,
		origin.x,
		origin.y,
	]
}

export function faceFrame(
	solid: Solid,
	view: { camera: Camera; floor: Size },
): FaceFrame {
	return {
		matrix: `matrix(${cellsOf(solid, view).join(' ')})`,
		width: solid.width,
		height: solid.top - solid.base,
	}
}

// The left edge of the plate at this index.
export function plateLeft(index: number): number {
	return PLATE.inset + index * PLATE.step
}

// The top of the plates' row on a front of this height: centred down it.
export function plateTop(height: number): number {
	return Math.max(0, (height - PLATE.square) * HALF)
}

// Where a front's plates land on the screen, each as the box around its square: what a link's words keep off.
export function plateBoxes(
	solid: Solid,
	view: { camera: Camera; floor: Size },
	count: number,
): Rect[] {
	const [a, b, c, d, e, f] = cellsOf(solid, view)
	const top = plateTop(solid.top - solid.base)
	return Array.from({ length: count }, (_, index) => {
		const left = plateLeft(index)
		const corners = [0, PLATE.square].flatMap(u =>
			[0, PLATE.square].map(v => ({
				x: a * (left + u) + c * (top + v) + e,
				y: b * (left + u) + d * (top + v) + f,
			})),
		)
		const xs = corners.map(point => point.x)
		const ys = corners.map(point => point.y)
		const x = Math.min(...xs)
		const y = Math.min(...ys)
		return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
	})
}
