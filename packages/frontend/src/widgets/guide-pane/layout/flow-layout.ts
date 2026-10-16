import { labelWidth } from './label-width'

import type { FlowBlock, FlowEdge } from '@entities/review/guide/model'

export type Placed = { id: string; x: number; y: number }

// How an edge is drawn: straight down to the next layer, or around the nodes through the gaps between layers and a gutter of its own right of the drawing (an edge that skips a layer, returns upward or loops on its node would otherwise run under the boxes painted over it).
export type FlowRoute = { kind: 'direct' } | { kind: 'around'; gutter: number }

export const FLOW_NODE = { width: 132, height: 32 }
const GAP_X = 20
export const GAP_Y = 44
const MARGIN = 10
const HALF = 2
const SIDES = 2
export const LABEL_GAP = 6
const GUTTER_GAP = 14

// Each node's layer: the longest path from a source (a cycle breaks at the first revisit), so an edge reads top to bottom and the shape of a dependency chain shows.
function layersOf(block: FlowBlock): Map<number, string[]> {
	const depth = new Map<string, number>()
	const visiting = new Set<string>()
	const rank = (id: string): number => {
		const known = depth.get(id)
		if (typeof known === 'number') return known
		if (visiting.has(id)) return 0
		visiting.add(id)
		const incoming = block.edges.filter(edge => edge.to === id)
		const level = incoming.length
			? 1 + Math.max(...incoming.map(edge => rank(edge.from)))
			: 0
		depth.set(id, level)
		return level
	}
	const layers = new Map<number, string[]>()
	for (const node of block.nodes) {
		const level = rank(node.id)
		layers.set(level, [...(layers.get(level) ?? []), node.id])
	}
	return layers
}

// An edge runs direct only into the next layer; skipping one, returning upward or looping on its node goes around.
function isDirect(edge: FlowEdge, rowOf: ReadonlyMap<string, number>): boolean {
	return (rowOf.get(edge.to) ?? 0) - (rowOf.get(edge.from) ?? 0) === 1
}

// Each routed edge gets the next gutter, its label beside it, so neither its line nor its words lie on another's.
function routesOf(
	block: FlowBlock,
	rowOf: ReadonlyMap<string, number>,
	firstGutter: number,
): { routes: FlowRoute[]; end: number } {
	let gutter = firstGutter
	let end = 0
	const routes = block.edges.map((edge): FlowRoute => {
		if (isDirect(edge, rowOf)) return { kind: 'direct' }
		const route: FlowRoute = { kind: 'around', gutter }
		end = gutter + LABEL_GAP + labelWidth(edge.label)
		gutter = end + GUTTER_GAP
		return route
	})
	return { routes, end }
}

// The nodes of one layer side by side, centred on the widest layer, the layers stacked from `top`.
function placeNodes(
	rows: readonly string[][],
	inner: number,
	top: number,
): Placed[] {
	return rows.flatMap((ids, rowIndex) => {
		const span = ids.length * FLOW_NODE.width + (ids.length - 1) * GAP_X
		const left = MARGIN + (inner - span) / HALF
		return ids.map((id, columnIndex) => ({
			id,
			x: left + columnIndex * (FLOW_NODE.width + GAP_X),
			y: top + rowIndex * (FLOW_NODE.height + GAP_Y),
		}))
	})
}

// The layers stack top-down, so a chain fits the explanation's column whatever its length. The width takes in every label: a direct edge's starts right of its bend, and the routed edges' gutters lie past all of them.
export function layoutFlow(block: FlowBlock): {
	nodes: Placed[]
	routes: FlowRoute[]
	width: number
	height: number
} {
	const layers = layersOf(block)
	const rows = [...layers.keys()]
		.toSorted((a, b) => a - b)
		.map(level => layers.get(level) ?? [])
	const rowOf = new Map(
		rows.flatMap((ids, row) => ids.map(id => [id, row] as const)),
	)
	const widest = Math.max(1, ...rows.map(ids => ids.length))
	const inner = widest * FLOW_NODE.width + (widest - 1) * GAP_X
	// A routed edge leaves through the gap under its source and enters through the gap over its target: half a layer gap is kept above the first layer and under the last.
	const routeRoom = block.edges.every(edge => isDirect(edge, rowOf))
		? 0
		: GAP_Y / HALF
	const nodes = placeNodes(rows, inner, MARGIN + routeRoom)
	const centre = (id: string): number =>
		(nodes.find(node => node.id === id)?.x ?? 0) + FLOW_NODE.width / HALF
	const directEnd = Math.max(
		MARGIN + inner,
		...block.edges
			.filter(edge => isDirect(edge, rowOf))
			.map(
				edge =>
					(centre(edge.from) + centre(edge.to)) / HALF +
					LABEL_GAP +
					labelWidth(edge.label),
			),
	)
	const { routes, end } = routesOf(block, rowOf, directEnd + GUTTER_GAP)
	return {
		nodes,
		routes,
		width: Math.max(directEnd, end) + MARGIN,
		height:
			rows.length * FLOW_NODE.height +
			(rows.length - 1) * GAP_Y +
			routeRoom * SIDES +
			MARGIN * SIDES,
	}
}
