import type { Direction } from '../layout/canvas-layout'

// The laid-out graph seen from above at an angle: the floor turns about its centre, tilts back from the screen, and the parts stand up from it. The same arithmetic places every face, link and label, so the drawing and the HTML over it never drift apart. CSS's axes: x right, y down, z toward the viewer.

export type Point3 = { x: number; y: number; z: number }
export type ScreenPoint = { x: number; y: number; depth: number }
export type Size = { width: number; height: number }

export type Camera = {
	// Degrees the floor turns, then tilts back.
	turn: number
	tilt: number
	// Pixels from the eye to the screen; without it the drawing has no perspective, as an isometric one.
	perspective?: number | undefined
	scale: number
	// Where the floor's centre lands in the field.
	centerX: number
	centerY: number
}

export type Angles = Pick<Camera, 'turn' | 'tilt' | 'perspective'>

const HALF_TURN = 180
const RADIANS = Math.PI / HALF_TURN
const MIDDLE = 0.5
// The space kept around the drawing in a fitted field, and the most it is ever enlarged.
const FIT_MARGIN = 32
const MAX_SCALE = 1.25

// The tilt of the classic 2:1 isometric drawing; an orbit starts there too.
export const ISO_TILT = 60
const TURN_DOWN = -135
const TURN_RIGHT = -45

// The floor turns so the side a link arrives at faces the viewer: ELK's links enter a part from its top when laid down and from its left when laid across, so either way the flow climbs up and to the right, into the scene, and every arrowhead stays in sight.
export function turnFor(direction: Direction): number {
	return direction === 'DOWN' ? TURN_DOWN : TURN_RIGHT
}

export function project(
	camera: Camera,
	floor: Size,
	point: Point3,
): ScreenPoint {
	const turn = camera.turn * RADIANS
	const tilt = camera.tilt * RADIANS
	const px = point.x - floor.width * MIDDLE
	const py = point.y - floor.height * MIDDLE
	const x1 = px * Math.cos(turn) - py * Math.sin(turn)
	const y1 = px * Math.sin(turn) + py * Math.cos(turn)
	const y2 = y1 * Math.cos(tilt) - point.z * Math.sin(tilt)
	const depth = y1 * Math.sin(tilt) + point.z * Math.cos(tilt)
	const lens = camera.perspective
		? camera.perspective / (camera.perspective - depth * camera.scale)
		: 1
	return {
		x: camera.centerX + x1 * camera.scale * lens,
		y: camera.centerY + y2 * camera.scale * lens,
		depth,
	}
}

// Whether a face whose outward normal is given turns toward the viewer; a face turned away is never drawn.
export function isFacing(angles: Angles, normal: Point3): boolean {
	const turn = angles.turn * RADIANS
	const tilt = angles.tilt * RADIANS
	const y1 = normal.x * Math.sin(turn) + normal.y * Math.cos(turn)
	return y1 * Math.sin(tilt) + normal.z * Math.cos(tilt) > 0
}

const CORNERS = [0, 1].flatMap(fx =>
	[0, 1].flatMap(fy => [0, 1].map(fz => ({ fx, fy, fz }))),
)

// What a camera frames: the floor, the height of the tallest thing on it, and the field it is drawn in.
export type Stage = { floor: Size; top: number; field: Size }

// The camera that fits the floor and everything standing on it into the field, centred.
export function fitCamera(
	angles: Angles,
	{ floor, top, field }: Stage,
): Camera {
	const probe = { ...angles, perspective: undefined, scale: 1 }
	const points = CORNERS.map(({ fx, fy, fz }) =>
		project({ ...probe, centerX: 0, centerY: 0 }, floor, {
			x: floor.width * fx,
			y: floor.height * fy,
			z: top * fz,
		}),
	)
	const xs = points.map(point => point.x)
	const ys = points.map(point => point.y)
	const left = Math.min(...xs)
	const right = Math.max(...xs)
	const high = Math.min(...ys)
	const low = Math.max(...ys)
	const scale = Math.min(
		MAX_SCALE,
		Math.max(1, field.width - FIT_MARGIN) / Math.max(1, right - left),
		Math.max(1, field.height - FIT_MARGIN) / Math.max(1, low - high),
	)
	return {
		...angles,
		scale,
		centerX: field.width * MIDDLE - scale * (left + right) * MIDDLE,
		centerY: field.height * MIDDLE - scale * (high + low) * MIDDLE,
	}
}

export type Orbit = { turn: number; tilt: number; zoom: number }

// The eye's distance in field widths, and the room an orbit keeps so the drawing stays inside the field as it turns.
const EYE_DISTANCE = 2.5
const ORBIT_ROOM = 0.8

// A camera turned and tilted by the reviewer, in perspective: the fitted scale with room to turn, times their zoom, the middle of the scene kept at the middle of the field.
export function orbitCamera(
	fitted: Camera,
	orbit: Orbit,
	stage: Stage,
): Camera {
	const probe = {
		turn: orbit.turn,
		tilt: orbit.tilt,
		perspective: stage.field.width * EYE_DISTANCE,
		scale: fitted.scale * ORBIT_ROOM * orbit.zoom,
		centerX: 0,
		centerY: 0,
	}
	const middle = project(probe, stage.floor, {
		x: stage.floor.width * MIDDLE,
		y: stage.floor.height * MIDDLE,
		z: stage.top * MIDDLE,
	})
	return {
		...probe,
		centerX: stage.field.width * MIDDLE - middle.x,
		centerY: stage.field.height * MIDDLE - middle.y,
	}
}
