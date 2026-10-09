import type { FlowBlock } from '@entities/review/guide/model'

export type Placed = { id: string; x: number; y: number }

export const FLOW_NODE = { width: 132, height: 32 }
const GAP_X = 20
const GAP_Y = 44
const MARGIN = 10
const HALF = 2
const SIDES = 2

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

// The layers stack top-down, so a chain fits the explanation's column whatever its length; the nodes of one layer sit side by side, centred on the widest layer.
export function layoutFlow(block: FlowBlock): {
	nodes: Placed[]
	width: number
	height: number
} {
	const layers = layersOf(block)
	const levels = [...layers.keys()].toSorted((a, b) => a - b)
	const widest = Math.max(
		1,
		...[...layers.values()].map(layer => layer.length),
	)
	const inner = widest * FLOW_NODE.width + (widest - 1) * GAP_X
	const nodes: Placed[] = []
	for (const [rowIndex, level] of levels.entries()) {
		const ids = layers.get(level) ?? []
		const span = ids.length * FLOW_NODE.width + (ids.length - 1) * GAP_X
		const left = MARGIN + (inner - span) / HALF
		for (const [columnIndex, id] of ids.entries())
			nodes.push({
				id,
				x: left + columnIndex * (FLOW_NODE.width + GAP_X),
				y: MARGIN + rowIndex * (FLOW_NODE.height + GAP_Y),
			})
	}
	return {
		nodes,
		width: inner + MARGIN * SIDES,
		height:
			levels.length * FLOW_NODE.height +
			(levels.length - 1) * GAP_Y +
			MARGIN * SIDES,
	}
}
