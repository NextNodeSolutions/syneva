import { isFacing, project } from './camera'

import type { Camera, Point3, Size } from './camera'
import type { Solid } from './solids'

// A face's own flat frame on the screen: the affine map that lays a point u along the face and v down it where the camera sees it, as an SVG matrix, so marks drawn in the face's units read as painted on it. Exact for the isometric camera, which has no perspective. A block tall enough wears its marks on its front; a low one on its top.

export type FaceFrame = { matrix: string; width: number; height: number }

const FRONT = { x: 0, y: 1, z: 0 }
// The least height a front face needs to carry a row of numbers.
const MIN_FRONT = 24

function frameOf(
	corners: { origin: Point3; along: Point3; down: Point3 },
	size: { width: number; height: number },
	view: { camera: Camera; floor: Size },
): FaceFrame {
	const seen = (point: Point3): { x: number; y: number } =>
		project(view.camera, view.floor, point)
	const origin = seen(corners.origin)
	const along = seen(corners.along)
	const down = seen(corners.down)
	const cells = [
		(along.x - origin.x) / size.width,
		(along.y - origin.y) / size.width,
		(down.x - origin.x) / size.height,
		(down.y - origin.y) / size.height,
		origin.x,
		origin.y,
	]
	return { matrix: `matrix(${cells.join(' ')})`, ...size }
}

export function faceFrame(
	solid: Solid,
	view: { camera: Camera; floor: Size },
): FaceFrame {
	const right = solid.x + solid.width
	const front = solid.y + solid.length
	const height = solid.top - solid.base
	if (height >= MIN_FRONT && isFacing(view.camera, FRONT))
		return frameOf(
			{
				origin: { x: solid.x, y: front, z: solid.top },
				along: { x: right, y: front, z: solid.top },
				down: { x: solid.x, y: front, z: solid.base },
			},
			{ width: solid.width, height },
			view,
		)
	return frameOf(
		{
			origin: { x: solid.x, y: solid.y, z: solid.top },
			along: { x: right, y: solid.y, z: solid.top },
			down: { x: solid.x, y: front, z: solid.top },
		},
		{ width: solid.width, height: solid.length },
		view,
	)
}
