import { tierPlan } from './tier-plan'
import { TIER_RISE } from './tier-solids'
import { TIER_MARGIN } from './tier-spots'

import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { Point3 } from './camera'
import type { Raised, RaisedLink } from './raised'
import type { Solid } from './solids'
import type { TierPlan } from './tier-plan'

// The tiers' links run in front of the floors, where nothing stands to hide them: a link leaves its part's front onto its floor, runs out past the floors' front edge, drops to the floor of the part it reaches, runs along that floor's front to the part and enters it. The run along a floor takes a lane of its own, one step further out for each link that ends on that floor, so two runs never lie on each other; a link between two parts of one floor is a loop in front of it.

const LANE = 18
const HALF = 0.5
// A straight drop says its words just under the upper floor's front: lower down, they would land among the names of the lower floor's parts.
const WORDS_DROP = 24

// Where a link meets a part: the middle of the part's front, on the ground it stands on (a container's zone, on top of it).
function anchorOf(solid: Solid): Point3 {
	return {
		x: solid.x + solid.width * HALF,
		y: solid.y + solid.length,
		z: solid.isPlatform ? solid.top : solid.base,
	}
}

function drops(scene: Scene, plan: TierPlan): RaisedLink[] {
	const lanes = new Map<number, number>()
	return scene.links.flatMap(link => {
		const from = plan.ends.get(link.from)
		const to = plan.ends.get(link.to)
		if (!from || !to) return []
		const start = anchorOf(from)
		const end = anchorOf(to)
		const floor = Math.floor(end.z / TIER_RISE)
		const lane = lanes.get(floor) ?? 0
		lanes.set(floor, lane + 1)
		const y = plan.depth + LANE * (lane + 1)
		const upper = Math.max(start.z, end.z)
		const fall = Math.min(WORDS_DROP, Math.abs(start.z - end.z) * HALF)
		const label =
			start.x === end.x
				? { x: start.x, y, z: upper - fall }
				: { x: (start.x + end.x) * HALF, y, z: end.z }
		return [
			{
				key: link.id,
				link,
				mark: link.change,
				isQuiet: false,
				isWorded: Boolean(link.change ?? link.step),
				route: {
					id: link.id,
					points: [
						start,
						{ ...start, y },
						{ x: start.x, y, z: end.z },
						{ ...end, y },
						end,
					],
					label,
				},
			},
		]
	})
}

export function tierRaised(scene: Scene, layout: CanvasLayout): Raised {
	const plan = tierPlan(scene, layout)
	const overlay = drops(scene, plan)
	const front = Math.max(
		plan.depth,
		...overlay.flatMap(link => link.route.points.map(point => point.y)),
	)
	return {
		floor: { width: plan.width, height: front + TIER_MARGIN },
		top: plan.top,
		decks: plan.floors.map(floor => ({
			id: floor.id,
			name: floor.name,
			slabs: floor.slabs,
			parts: floor.parts,
			links: [],
			isHanging: false,
		})),
		overlay,
		traces: [],
	}
}
