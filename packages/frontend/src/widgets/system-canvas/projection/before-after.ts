import { planDeck, planLinks, planParts } from './plan-raised'
import { PLATFORM } from './solids'

import type { ChangeMark } from '@entities/review/guide/model'
import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { Point3 } from './camera'
import type { Deck, Raised, RaisedLink, RaisedPart, Trace } from './raised'
import type { Route, Solid } from './solids'

// The system before the change under the system after it: the plan laid out once and raised twice, two floors a gap apart. The upper floor is the system after, its parts standing on it, the added ones lit; the lower floor is the system before, its parts hanging under it, the removed ones lit red, so a reviewer who tilts the camera under the floors reads it the right way up, as they read the upper one from above. A part on both floors is joined through the gap by a thin vertical trace. The floor away from the camera steps back behind its slab, its news still lit, and says nothing: the names and the words are the near floor's.

export type Side = 'before' | 'after'

// The tilt each floor is read from: over the floors for the system after, the mirror of it under them for the system before.
export const POSE_TILT: Record<Side, number> = { after: 52, before: 128 }
// The side view: below it the camera looks down on the floors, above it up at them.
const SIDE_VIEW = 90

export function sideOf(tilt: number): Side {
	return tilt < SIDE_VIEW ? 'after' : 'before'
}

// What a floor leaves out, and what is news on it.
const LEFT_OUT: Record<Side, ChangeMark> = { before: 'added', after: 'removed' }
const NEWS: Record<Side, ChangeMark> = { before: 'removed', after: 'added' }
const NAMES: Record<Side, string> = { before: 'Before', after: 'After' }

// The gap between the floors, wide enough to look between them and growing with the plan; the floors' two slabs.
const MIN_GAP = 140
const GAP_SHARE = 0.3
const SLABS = 2
const HALF = 0.5

// One floor's frame: the plan's own height, how high the upper floor's ground stands, and whether the camera is on this floor's side.
type Frame = { side: Side; height: number; lift: number; isNear: boolean }

// The lower floor hangs its plan upside down under its slab; the upper one stands it on its slab.
function zOf(frame: Frame, z: number): number {
	return frame.side === 'before' ? frame.height - z : z + frame.lift
}

function liftSolid(solid: Solid, frame: Frame): Solid {
	const low = zOf(frame, solid.base)
	const high = zOf(frame, solid.top)
	return {
		id: solid.id,
		isPlatform: solid.isPlatform,
		x: solid.x,
		y: solid.y,
		width: solid.width,
		length: solid.length,
		base: Math.min(low, high),
		top: Math.max(low, high),
	}
}

function liftRoute(route: Route, frame: Frame): Route {
	const at = (point: Point3): Point3 => ({
		x: point.x,
		y: point.y,
		z: zOf(frame, point.z),
	})
	if (!frame.isNear || !route.label)
		return { id: route.id, points: route.points.map(at) }
	return {
		id: route.id,
		points: route.points.map(at),
		label: at(route.label),
	}
}

function sideParts(parts: readonly RaisedPart[], frame: Frame): RaisedPart[] {
	return parts
		.filter(part => part.mark !== LEFT_OUT[frame.side])
		.map(part => {
			const isNews = part.mark === NEWS[frame.side]
			return {
				key: `${frame.side}:${part.key}`,
				solid: liftSolid(part.solid, frame),
				element: part.element,
				mark: part.mark,
				level: part.level,
				isQuiet: !frame.isNear && !isNews,
				isNamed: frame.isNear,
				isNumbered: false,
			}
		})
}

// A link goes with either of its ends.
function sideLinks(
	links: readonly RaisedLink[],
	frame: Frame,
	gone: ReadonlySet<string>,
): RaisedLink[] {
	return links
		.filter(
			entry =>
				entry.mark !== LEFT_OUT[frame.side] &&
				!gone.has(entry.link.from) &&
				!gone.has(entry.link.to),
		)
		.map(entry => {
			const isQuiet = !frame.isNear && entry.mark !== NEWS[frame.side]
			return {
				key: `${frame.side}:${entry.key}`,
				route: liftRoute(entry.route, frame),
				link: entry.link,
				mark: entry.mark,
				isQuiet,
				isWorded: entry.isWorded,
			}
		})
}

function slabOf(
	side: Side,
	floor: { width: number; length: number },
	base: number,
): Solid {
	return {
		id: `slab:${side}`,
		isPlatform: true,
		x: 0,
		y: 0,
		width: floor.width,
		length: floor.length,
		base,
		top: base + PLATFORM,
	}
}

// A part on both floors, joined through the gap at the middle of its footprint.
function tracesOf(
	parts: readonly RaisedPart[],
	from: number,
	to: number,
): Trace[] {
	return parts
		.filter(
			part =>
				!part.solid.isPlatform &&
				part.mark !== 'added' &&
				part.mark !== 'removed',
		)
		.map(part => {
			const x = part.solid.x + part.solid.width * HALF
			const y = part.solid.y + part.solid.length * HALF
			return {
				key: `trace:${part.key}`,
				id: part.element.id,
				from: { x, y, z: from },
				to: { x, y, z: to },
			}
		})
}

export function beforeAfter(
	scene: Scene,
	layout: CanvasLayout,
	isLookingDown: boolean,
): Raised {
	const plan = planDeck(layout)
	const parts = planParts(scene, layout, plan.solids)
	const links = planLinks(scene, plan.routes)
	const height = plan.top
	const gap = Math.max(
		MIN_GAP,
		GAP_SHARE * Math.max(layout.width, layout.height),
	)
	const lift = height + PLATFORM * SLABS + gap
	const floor = { width: layout.width, length: layout.height }
	const deckOf = (side: Side, base: number): Deck => {
		const frame = {
			side,
			height,
			lift,
			isNear: (side === 'after') === isLookingDown,
		}
		const gone = new Set(
			[...scene.elements.values()]
				.filter(element => element.change === LEFT_OUT[side])
				.map(element => element.id),
		)
		return {
			id: side,
			name: NAMES[side],
			slabs: [slabOf(side, floor, base)],
			parts: sideParts(parts, frame),
			links: sideLinks(links, frame, gone),
			isHanging: side === 'before',
		}
	}
	return {
		floor: { width: layout.width, height: layout.height },
		top: lift + height,
		decks: [deckOf('before', height), deckOf('after', lift - PLATFORM)],
		overlay: [],
		traces: tracesOf(parts, height + PLATFORM, lift - PLATFORM),
	}
}
