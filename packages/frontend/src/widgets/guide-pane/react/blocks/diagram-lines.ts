import type { DiagramBlock } from '@entities/review/guide/model'

// A diagram as sentences, apart from any drawing or desk: the guide's text equivalent reads it,
// and so does a plan's figure.

type GraphNode = {
	id: string
	label: string
	ref?: string | undefined
	note?: string | undefined
}

type Graph = {
	nodes: readonly GraphNode[]
	edges: readonly { from: string; to: string }[]
}

// Any diagram's nodes and edges under one name, whatever its kind calls them.
export function graphOf(block: DiagramBlock): Graph {
	if (block.kind === 'state')
		return { nodes: block.states, edges: block.transitions }
	if (block.kind === 'sequence')
		return { nodes: block.participants, edges: block.steps }
	return { nodes: block.nodes, edges: block.edges }
}

export type Line = { text: string; refId?: string | undefined }

function labelOf(
	nodes: readonly { id: string; label: string }[],
	id: string,
): string {
	return nodes.find(node => node.id === id)?.label ?? id
}

// A node gets its own sentence when the edges would lose it: it links to code, carries a note, or no edge touches it.
function nodeLines({ nodes, edges }: Graph): Line[] {
	return nodes
		.filter(
			node =>
				Boolean(node.ref) ||
				Boolean(node.note) ||
				!edges.some(
					edge => edge.from === node.id || edge.to === node.id,
				),
		)
		.map(node => ({
			text: node.note ? `${node.label}: ${node.note}` : node.label,
			refId: node.ref,
		}))
}

// The diagram as sentences, its kept nodes then one per edge, in the block's order: what a screen reader and a reviewer without the drawing read, and what shows while the diagram chunk loads. A sequence's participants are its lifelines, never sentences of their own.
export function lines(block: DiagramBlock): Line[] {
	if (block.kind === 'sequence') return edgeLines(block)
	return [...nodeLines(graphOf(block)), ...edgeLines(block)]
}

function edgeLines(block: DiagramBlock): Line[] {
	if (block.kind === 'state')
		return block.transitions.map(transition => ({
			text: `${labelOf(block.states, transition.from)} → ${labelOf(block.states, transition.to)}${transition.label ? ` on ${transition.label}` : ''}`,
			refId: transition.ref,
		}))
	if (block.kind === 'sequence')
		return block.steps.map(step => ({
			text: `${labelOf(block.participants, step.from)} → ${labelOf(block.participants, step.to)}: ${step.label}`,
			refId: step.ref,
		}))
	return block.edges.map(edge => ({
		text: `${labelOf(block.nodes, edge.from)} → ${labelOf(block.nodes, edge.to)}${edge.label ? ` (${edge.label})` : ''}`,
	}))
}
