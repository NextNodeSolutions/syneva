import { project } from './camera'

import type { Camera, Point3, Size } from './camera'
import type { Solid } from './solids'

// A block's front as its own flat frame on the screen: the affine map that lays a point u along the front and v down it where the camera sees it, as an SVG matrix, so marks drawn in the front's units read as painted on it. Exact for the isometric camera, which has no perspective and always sees the fronts.

export type FaceFrame = { matrix: string; width: number; height: number }

// The least height a front needs to carry a row of numbers; a lower block carries them in its name.
export const NUMBER_ROOM = 24

export function faceFrame(
	solid: Solid,
	view: { camera: Camera; floor: Size },
): FaceFrame {
	const seen = (point: Point3): { x: number; y: number } =>
		project(view.camera, view.floor, point)
	const front = solid.y + solid.length
	const height = solid.top - solid.base
	const origin = seen({ x: solid.x, y: front, z: solid.top })
	const along = seen({ x: solid.x + solid.width, y: front, z: solid.top })
	const down = seen({ x: solid.x, y: front, z: solid.base })
	const cells = [
		(along.x - origin.x) / solid.width,
		(along.y - origin.y) / solid.width,
		(down.x - origin.x) / height,
		(down.y - origin.y) / height,
		origin.x,
		origin.y,
	]
	return { matrix: `matrix(${cells.join(' ')})`, width: solid.width, height }
}
