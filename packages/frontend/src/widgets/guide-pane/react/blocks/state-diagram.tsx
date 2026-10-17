import { nodeHeight } from '../../layout/node-label'

import { GraphDiagram } from './graph-diagram'

import type {
	GuideDomain,
	StateBlock,
	StateNode,
} from '@entities/review/guide/model'
import type { GraphInput, GraphNodeInput } from '@shared/lib/graph-layout'
import type { ReactElement } from 'react'

const STATE_NODE = { width: 124, height: 34 }

function shapeOf(state: StateNode): 'initial' | 'final' | undefined {
	if (state.isInitial) return 'initial'
	if (state.isFinal) return 'final'
	return undefined
}

function layerOf(state: StateNode): GraphNodeInput['layer'] {
	if (state.isInitial) return 'first'
	if (state.isFinal) return 'last'
	return undefined
}

function stateGraph(block: StateBlock): GraphInput {
	const height = nodeHeight(
		block.states.map(state => state.label),
		STATE_NODE.width,
		STATE_NODE.height,
	)
	return {
		direction: 'RIGHT',
		nodes: block.states.map(state => ({
			id: state.id,
			width: STATE_NODE.width,
			height,
			layer: layerOf(state),
		})),
		edges: block.transitions.map(transition => ({
			from: transition.from,
			to: transition.to,
			label: transition.label,
		})),
	}
}

// A state machine left to right, the initial state first and the final ones last; every transition is routed around the boxes, a loop back included.
export function StateDiagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: StateBlock
}): ReactElement {
	return (
		<GraphDiagram
			domain={domain}
			input={stateGraph(block)}
			nodes={block.states.map(state => ({
				id: state.id,
				label: state.label,
				refId: state.ref,
				shape: shapeOf(state),
			}))}
			edgeRefs={block.transitions.map(transition => transition.ref)}
			ariaLabel={`State diagram: ${block.title ?? ''}`}
		/>
	)
}
