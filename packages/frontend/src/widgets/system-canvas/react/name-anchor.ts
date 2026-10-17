import { project } from '../projection/camera'

import type { ScreenPoint } from '../projection/camera'
import type { RaisedPart } from '../projection/raised'
import type { Solid } from '../projection/solids'
import type { View } from './solid-shape'

const MIDDLE = 0.5
// How far beyond its block a part's name floats.
const LIFT = 6

function topCorners(solid: Solid, view: View, z: number): ScreenPoint[] {
	return [0, 1].flatMap(fx =>
		[0, 1].map(fy =>
			project(view.camera, view.floor, {
				x: solid.x + solid.width * fx,
				y: solid.y + solid.length * fy,
				z,
			}),
		),
	)
}

// Where a part's name goes: a block's over the middle of its free end (above a standing block, under a hanging one); a platform's under the corner of its top nearest the bottom of the field, like a plaque.
export function nameAnchor(
	part: RaisedPart,
	isHanging: boolean,
	view: View,
): { at: ScreenPoint; isUnder: boolean } {
	const { solid } = part
	if (solid.isPlatform) {
		const corners = topCorners(solid, view, solid.top)
		return {
			at: corners.reduce((low, point) => (point.y > low.y ? point : low)),
			isUnder: true,
		}
	}
	return {
		at: project(view.camera, view.floor, {
			x: solid.x + solid.width * MIDDLE,
			y: solid.y + solid.length * MIDDLE,
			z: isHanging ? solid.base - LIFT : solid.top + LIFT,
		}),
		isUnder: isHanging,
	}
}

// The leftmost corner of a slab's top, where its deck's name stands.
export function slabCorner(slab: Solid, view: View): ScreenPoint {
	return topCorners(slab, view, slab.top).reduce((left, point) =>
		point.x < left.x ? point : left,
	)
}
