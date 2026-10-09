import type { SequenceBlock } from '@entities/review/guide/model'

export const LANE = { width: 150, headHeight: 30, headWidth: 124 }
export const STEP_HEIGHT = 40
const TOP = 10
const MARGIN = 10
const FIRST_STEP_OFFSET = 60
const HALF = 2
const SIDES = 2

// One lane per participant in declared order, one row per step in message order: the layout a reviewer reads top to bottom.
export function layoutSequence(block: SequenceBlock): {
	lanes: { id: string; x: number }[]
	stepY: (index: number) => number
	width: number
	height: number
} {
	const lanes = block.participants.map((participant, index) => ({
		id: participant.id,
		x: MARGIN + index * LANE.width + LANE.width / HALF,
	}))
	return {
		lanes,
		stepY: index => TOP + FIRST_STEP_OFFSET + index * STEP_HEIGHT,
		width: block.participants.length * LANE.width + MARGIN * SIDES,
		height: TOP + FIRST_STEP_OFFSET + block.steps.length * STEP_HEIGHT,
	}
}

export function laneX(
	lanes: readonly { id: string; x: number }[],
	id: string,
): number {
	return lanes.find(lane => lane.id === id)?.x ?? 0
}
