import { nodeHeight } from '../../layout/node-label'

import { GraphDiagram } from './graph-diagram'

import type { FlowBlock, GuideDomain } from '@entities/review/guide/model'
import type { GraphInput } from '@shared/lib/graph-layout'
import type { ReactElement } from 'react'

const FLOW_NODE = { width: 132, height: 32 }

// Every node as tall as the diagram's tallest wrapped label, so the layers stay aligned.
function flowGraph(block: FlowBlock): GraphInput {
	const height = nodeHeight(
		block.nodes.map(node => node.label),
		FLOW_NODE.width,
		FLOW_NODE.height,
	)
	return {
		direction: 'DOWN',
		nodes: block.nodes.map(node => ({
			id: node.id,
			width: FLOW_NODE.width,
			height,
		})),
		edges: block.edges.map(edge => ({
			from: edge.from,
			to: edge.to,
			label: edge.label,
		})),
	}
}

// A dependency or data flow, top to bottom: the layers stack down so a chain fits the explanation's column whatever its length.
export function FlowDiagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: FlowBlock
}): ReactElement {
	return (
		<GraphDiagram
			domain={domain}
			input={flowGraph(block)}
			nodes={block.nodes.map(node => ({
				id: node.id,
				label: node.label,
				refId: node.ref,
			}))}
			ariaLabel={`Data flow: ${block.title ?? ''}`}
		/>
	)
}
