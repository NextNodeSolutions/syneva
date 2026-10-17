import { isFacing, project } from './camera'

import type { Camera, Point3, ScreenPoint, Size } from './camera'
import type { Solid } from './solids'

// A solid as the faces the camera sees: its top always (the camera looks down), and each side that turns toward the viewer. Sides along the floor's x axis and along its y axis take two shades, so a block's edges read without any outline.

export type FaceKind = 'top' | 'side' | 'end'

export type Face = { kind: FaceKind; points: ScreenPoint[] }

type Corner = { fx: number; fy: number }

type SideSpec = { kind: FaceKind; normal: Point3; corners: [Corner, Corner] }

const MIDDLE = 0.5

// Each side as its outward normal and the two footprint corners it stands on.
const SIDES: SideSpec[] = [
	{
		kind: 'side',
		normal: { x: 0, y: 1, z: 0 },
		corners: [
			{ fx: 0, fy: 1 },
			{ fx: 1, fy: 1 },
		],
	},
	{
		kind: 'side',
		normal: { x: 0, y: -1, z: 0 },
		corners: [
			{ fx: 1, fy: 0 },
			{ fx: 0, fy: 0 },
		],
	},
	{
		kind: 'end',
		normal: { x: 1, y: 0, z: 0 },
		corners: [
			{ fx: 1, fy: 1 },
			{ fx: 1, fy: 0 },
		],
	},
	{
		kind: 'end',
		normal: { x: -1, y: 0, z: 0 },
		corners: [
			{ fx: 0, fy: 0 },
			{ fx: 0, fy: 1 },
		],
	},
]

const TOP: Corner[] = [
	{ fx: 0, fy: 0 },
	{ fx: 1, fy: 0 },
	{ fx: 1, fy: 1 },
	{ fx: 0, fy: 1 },
]

function corner(solid: Solid, { fx, fy }: Corner, z: number): Point3 {
	return { x: solid.x + solid.width * fx, y: solid.y + solid.length * fy, z }
}

export function facesOf(solid: Solid, camera: Camera, floor: Size): Face[] {
	const seen = (point: Point3): ScreenPoint => project(camera, floor, point)
	const sides = SIDES.filter(side => isFacing(camera, side.normal)).map(
		side => {
			const [from, to] = side.corners
			return {
				kind: side.kind,
				points: [
					seen(corner(solid, from, solid.base)),
					seen(corner(solid, to, solid.base)),
					seen(corner(solid, to, solid.top)),
					seen(corner(solid, from, solid.top)),
				],
			}
		},
	)
	const top = {
		kind: 'top' as const,
		points: TOP.map(entry => seen(corner(solid, entry, solid.top))),
	}
	return [...sides, top]
}

export function polygon(points: readonly ScreenPoint[]): string {
	return points.map(point => `${point.x},${point.y}`).join(' ')
}

// How near a solid stands to the viewer, from the middle of its footprint.
export function nearness(solid: Solid, camera: Camera, floor: Size): number {
	return project(camera, floor, {
		x: solid.x + solid.width * MIDDLE,
		y: solid.y + solid.length * MIDDLE,
		z: solid.base,
	}).depth
}

// The painter's order: platforms first, each under what it holds, then the links laid over them (drawn by the caller), then the blocks from the farthest to the nearest, so a nearer block covers a farther one.
export function paintOrder(
	solids: readonly Solid[],
	camera: Camera,
	floor: Size,
): { platforms: Solid[]; blocks: Solid[] } {
	const byNearness = (a: Solid, b: Solid): number =>
		a.base - b.base ||
		nearness(a, camera, floor) - nearness(b, camera, floor)
	return {
		platforms: solids
			.filter(solid => solid.isPlatform)
			.toSorted(byNearness),
		blocks: solids
			.filter(solid => !solid.isPlatform)
			.toSorted(
				(a, b) =>
					nearness(a, camera, floor) - nearness(b, camera, floor),
			),
	}
}
