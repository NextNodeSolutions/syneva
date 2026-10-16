import { labelWidth } from './label-width'
import { nodeHeight } from './node-label'

import type { FlowBlock, FlowEdge } from '@entities/review/guide/model'

export type Placed = { id: string; x: number; y: number }

// How an edge is drawn: straight down to the next layer, or around the nodes through the gaps between layers and a gutter of its own right of the drawing (an edge that skips a layer, returns upward or loops on its node would otherwise run under the boxes painted over it, and one whose label would land on another direct label would hide its words).
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

// An edge can run direct only into the next layer; skipping one, returning upward or looping on its node goes around.
function intoNextLayer(
	edge: FlowEdge,
	rowOf: ReadonlyMap<string, number>,
): boolean {
	return (rowOf.get(edge.to) ?? 0) - (rowOf.get(edge.from) ?? 0) === 1
}

type Span = { start: number; end: number }

// A direct edge's label sits at its curve's middle, so a second edge between the same nodes, or one crossing it in the same gap, would print its words on the first's: an edge stays direct only while its label clears every direct label already in that gap, and goes around otherwise.
function directEdges(
	block: FlowBlock,
	rowOf: ReadonlyMap<string, number>,
	centre: (id: string) => number,
): boolean[] {
	const taken = new Map<number, Span[]>()
	return block.edges.map(edge => {
		if (!intoNextLayer(edge, rowOf)) return false
		const row = rowOf.get(edge.from) ?? 0
		const start = (centre(edge.from) + centre(edge.to)) / HALF + LABEL_GAP
		const span = { start, end: start + labelWidth(edge.label) }
		const spans = taken.get(row) ?? []
		if (
			spans.some(
				other => span.start < other.end && other.start < span.end,
			)
		)
			return false
		taken.set(row, [...spans, span])
		return true
	})
}

// Each routed edge gets the next gutter, its label beside it, so neither its line nor its words lie on another's.
function routesOf(
	block: FlowBlock,
	direct: readonly boolean[],
	firstGutter: number,
): { routes: FlowRoute[]; end: number } {
	let gutter = firstGutter
	let end = 0
	const routes = block.edges.map((edge, index): FlowRoute => {
		if (direct[index]) return { kind: 'direct' }
		const route: FlowRoute = { kind: 'around', gutter }
		end = gutter + LABEL_GAP + labelWidth(edge.label)
		gutter = end + GUTTER_GAP
		return route
	})
	return { routes, end }
}

// The nodes of one layer side by side, centred on the widest layer, the layers stacked from `top`, each as tall as the diagram's tallest label needs.
function placeNodes(
	rows: readonly string[][],
	inner: number,
	top: number,
	height: number,
): Placed[] {
	return rows.flatMap((ids, rowIndex) => {
		const span = ids.length * FLOW_NODE.width + (ids.length - 1) * GAP_X
		const left = MARGIN + (inner - span) / HALF
		return ids.map((id, columnIndex) => ({
			id,
			x: left + columnIndex * (FLOW_NODE.width + GAP_X),
			y: top + rowIndex * (height + GAP_Y),
		}))
	})
}

function flowNodeHeight(block: FlowBlock): number {
	return nodeHeight(
		block.nodes.map(node => node.label),
		FLOW_NODE.width,
		FLOW_NODE.height,
	)
}

// The layers stack top-down, so a chain fits the explanation's column whatever its length. The width takes in every label: a direct edge's starts right of its bend, and the routed edges' gutters lie past all of them.
export function layoutFlow(block: FlowBlock): {
	nodes: Placed[]
	routes: FlowRoute[]
	nodeHeight: number
	width: number
	height: number
} {
	const height = flowNodeHeight(block)
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
	// The columns do not depend on the vertical room, so they are known before deciding which edges run direct.
	const columns = placeNodes(rows, inner, 0, height)
	const centre = (id: string): number =>
		(columns.find(node => node.id === id)?.x ?? 0) + FLOW_NODE.width / HALF
	const direct = directEdges(block, rowOf, centre)
	const routeRoom = direct.every(Boolean) ? 0 : GAP_Y / HALF
	const nodes = placeNodes(rows, inner, MARGIN + routeRoom, height)
	const directEnd = Math.max(
		MARGIN + inner,
		...block.edges
			.filter((_, index) => direct[index])
			.map(
				edge =>
					(centre(edge.from) + centre(edge.to)) / HALF +
					LABEL_GAP +
					labelWidth(edge.label),
			),
	)
	const { routes, end } = routesOf(block, direct, directEnd + GUTTER_GAP)
	return {
		nodes,
		routes,
		nodeHeight: height,
		width: Math.max(directEnd, end) + MARGIN,
		height:
			rows.length * height +
			(rows.length - 1) * GAP_Y +
			routeRoom * SIDES +
			MARGIN * SIDES,
	}
}
