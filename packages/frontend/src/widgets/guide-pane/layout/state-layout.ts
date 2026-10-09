import type { StateBlock } from '@entities/review/guide/model'
import type { Placed } from './flow-layout'

export const STATE_NODE = { width: 124, height: 34 }
const GAP = 64
const MARGIN = 10
const TOP = 54
const BACK_EDGE_ROOM = 60
const SIDES = 2

export function position(nodes: readonly Placed[], id: string): number {
	return nodes.findIndex(node => node.id === id)
}

// States in their declared order on one row, initial first and final last: forward transitions run straight between neighbours, a transition back loops under the row.
export function layoutStates(block: StateBlock): {
	nodes: Placed[]
	width: number
	height: number
} {
	const ordered = block.states
		.map((state, index) => ({ state, index }))
		.toSorted((a, b) => {
			if (a.state.isInitial !== b.state.isInitial)
				return a.state.isInitial ? -1 : 1
			if (a.state.isFinal !== b.state.isFinal)
				return a.state.isFinal ? 1 : -1
			return a.index - b.index
		})
	const nodes = ordered.map(({ state }, slot) => ({
		id: state.id,
		x: MARGIN + slot * (STATE_NODE.width + GAP),
		y: TOP,
	}))
	const hasBackEdge = block.transitions.some(
		transition =>
			position(nodes, transition.from) > position(nodes, transition.to),
	)
	const backRoom = hasBackEdge ? BACK_EDGE_ROOM : 0
	return {
		nodes,
		width:
			nodes.length * STATE_NODE.width +
			(nodes.length - 1) * GAP +
			MARGIN * SIDES,
		height: TOP + STATE_NODE.height + backRoom + MARGIN,
	}
}
