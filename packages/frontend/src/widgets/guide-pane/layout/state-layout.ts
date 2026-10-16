import { labelWidth } from './label-width'

import type { StateBlock } from '@entities/review/guide/model'
import type { Placed } from './flow-layout'

export const STATE_NODE = { width: 124, height: 34 }
const GAP = 64
const MARGIN = 10
const MIN_TOP = 54
const LEVEL_STEP = 16
const LABEL_ROOM = 12
const LOOP_SHIFT = 8
const LABEL_LIFT = 4
const LABEL_DROP = 11
const HALF = 2
const SIDES = 2

// How a transition is drawn: straight between neighbours on the row, or as a bracket on its own level, over the row (forward past a state, onto itself, or a repeat of a neighbour pair) or under it (backward), so no box hides its line or its label.
export type StateRoute =
	| { kind: 'straight' }
	| {
			kind: 'bracket'
			x1: number
			x2: number
			edgeY: number
			lineY: number
			labelY: number
	  }

export function position(nodes: readonly Placed[], id: string): number {
	return nodes.findIndex(node => node.id === id)
}

function centre(nodes: readonly Placed[], id: string): number {
	return (nodes[position(nodes, id)]?.x ?? 0) + STATE_NODE.width / HALF
}

// States in their declared order on one row, initial first and final last.
function rowOf(block: StateBlock): Placed[] {
	return block.states
		.map((state, index) => ({ state, index }))
		.toSorted((a, b) => {
			if (a.state.isInitial !== b.state.isInitial)
				return a.state.isInitial ? -1 : 1
			if (a.state.isFinal !== b.state.isFinal)
				return a.state.isFinal ? 1 : -1
			return a.index - b.index
		})
		.map(({ state }, slot) => ({
			id: state.id,
			x: slot * (STATE_NODE.width + GAP),
			y: 0,
		}))
}

type Kind = 'straight' | 'over' | 'under'

function kindsOf(block: StateBlock, nodes: readonly Placed[]): Kind[] {
	const drawnStraight = new Set<string>()
	return block.transitions.map(transition => {
		const from = position(nodes, transition.from)
		const to = position(nodes, transition.to)
		const pair = `${transition.from}→${transition.to}`
		if (to === from + 1 && !drawnStraight.has(pair)) {
			drawnStraight.add(pair)
			return 'straight'
		}
		return to >= from ? 'over' : 'under'
	})
}

// Each label's horizontal extent, centred between its two states whatever the route: the drawing's width and left margin come from these.
function labelSpans(
	block: StateBlock,
	row: readonly Placed[],
): { left: number; right: number }[] {
	return block.transitions.map(transition => {
		const middle =
			(centre(row, transition.from) + centre(row, transition.to)) / HALF
		const half = labelWidth(transition.label) / HALF
		return { left: middle - half, right: middle + half }
	})
}

function routesOf(
	block: StateBlock,
	nodes: readonly Placed[],
	kinds: readonly Kind[],
	edges: { top: number; base: number },
): StateRoute[] {
	const levels = { over: 0, under: 0 }
	return block.transitions.map((transition, index): StateRoute => {
		const kind = kinds[index] ?? 'straight'
		if (kind === 'straight') return { kind }
		const isOver = kind === 'over'
		const level = ++levels[kind]
		const shift = isOver ? LOOP_SHIFT : -LOOP_SHIFT
		const lineY = isOver
			? edges.top - level * LEVEL_STEP
			: edges.base + level * LEVEL_STEP
		return {
			kind: 'bracket',
			x1: centre(nodes, transition.from) + shift,
			x2: centre(nodes, transition.to) - shift,
			edgeY: isOver ? edges.top : edges.base,
			lineY,
			labelY: isOver ? lineY - LABEL_LIFT : lineY + LABEL_DROP,
		}
	})
}

// The row with its transitions: neighbours joined straight, every other transition on a level of its own over or under the row. The drawing is wide enough for every label and starts far enough right for the first one.
export function layoutStates(block: StateBlock): {
	nodes: Placed[]
	routes: StateRoute[]
	width: number
	height: number
} {
	const row = rowOf(block)
	const spans = labelSpans(block, row)
	const offset = Math.max(MARGIN, ...spans.map(span => MARGIN - span.left))
	const kinds = kindsOf(block, row)
	const overs = kinds.filter(kind => kind === 'over').length
	const unders = kinds.filter(kind => kind === 'under').length
	const top = Math.max(MIN_TOP, MARGIN + overs * LEVEL_STEP + LABEL_ROOM)
	const base = top + STATE_NODE.height
	const nodes = row.map(node => ({ id: node.id, x: node.x + offset, y: top }))
	const rowEnd = row.length * STATE_NODE.width + (row.length - 1) * GAP
	return {
		nodes,
		routes: routesOf(block, nodes, kinds, { top, base }),
		width:
			offset +
			Math.max(rowEnd, ...spans.map(span => span.right)) +
			MARGIN,
		height:
			base +
			(unders ? unders * LEVEL_STEP + LABEL_ROOM : 0) +
			MARGIN * SIDES,
	}
}
