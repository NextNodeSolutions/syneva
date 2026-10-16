import { labelWidth } from './label-width'

import type { SequenceBlock } from '@entities/review/guide/model'

export const LANE = { width: 150, headHeight: 30, headWidth: 124 }
export const STEP_HEIGHT = 40
// A message to its own lane loops this far right, its label starting just past the loop.
export const SELF_LOOP = 40
export const SELF_LABEL_GAP = 6
const TOP = 10
const MARGIN = 10
const FIRST_STEP_OFFSET = 60
const HALF = 2
const SIDES = 2

// The step's label as drawn: numbered in the order it happens.
export function stepLabel(index: number, label: string): string {
	return `${index + 1}. ${label}`
}

// One lane per participant in declared order, one row per step in message order: the layout a reviewer reads top to bottom. A self-message's label runs right of its lane, so the width reaches the end of the furthest one.
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
	const selfLabelEnds = block.steps.flatMap((step, index) =>
		step.from === step.to
			? [
					laneX(lanes, step.from) +
						SELF_LOOP +
						SELF_LABEL_GAP +
						labelWidth(stepLabel(index, step.label)) +
						MARGIN,
				]
			: [],
	)
	return {
		lanes,
		stepY: index => TOP + FIRST_STEP_OFFSET + index * STEP_HEIGHT,
		width: Math.max(
			block.participants.length * LANE.width + MARGIN * SIDES,
			...selfLabelEnds,
		),
		height: TOP + FIRST_STEP_OFFSET + block.steps.length * STEP_HEIGHT,
	}
}

export function laneX(
	lanes: readonly { id: string; x: number }[],
	id: string,
): number {
	return lanes.find(lane => lane.id === id)?.x ?? 0
}
