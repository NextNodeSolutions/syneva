import * as stylex from '@stylexjs/stylex'

import { FLOW_NODE, layoutFlow } from '../../layout/flow-layout'
import { edgeKeys } from '../../layout/keys'

import { ARROW_END, ArrowMarker } from './arrow-marker'
import { DiagramNode } from './diagram-node'
import { diagram } from './diagram.styles'
import { EdgeLabel } from './edge-label'

import type {
	FlowBlock,
	FlowEdge,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { Placed } from '../../layout/flow-layout'

const LABEL_GAP = 6
const LABEL_BASELINE = 3
const HALF = 2

function placed(nodes: readonly Placed[], id: string): Placed {
	return nodes.find(node => node.id === id) ?? { id, x: 0, y: 0 }
}

// A dependency drawn top to bottom: a curve from the source's bottom edge to the target's top edge, its label beside the bend.
function Edge({
	domain,
	edge,
	nodes,
}: {
	domain: GuideDomain
	edge: FlowEdge
	nodes: readonly Placed[]
}): ReactElement {
	const from = placed(nodes, edge.from)
	const to = placed(nodes, edge.to)
	const x1 = from.x + FLOW_NODE.width / HALF
	const y1 = from.y + FLOW_NODE.height
	const x2 = to.x + FLOW_NODE.width / HALF
	const my = (y1 + to.y) / HALF
	return (
		<g>
			<path
				d={`M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${to.y}`}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				domain={domain}
				at={{
					x: (x1 + x2) / HALF + LABEL_GAP,
					y: my + LABEL_BASELINE,
					anchor: 'start',
				}}
				label={edge.label}
			/>
		</g>
	)
}

export function FlowDiagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: FlowBlock
}): ReactElement {
	const layout = layoutFlow(block)
	const keys = edgeKeys(block.edges)
	return (
		<svg
			viewBox={`0 0 ${layout.width} ${layout.height}`}
			width={layout.width}
			height={layout.height}
			role="img"
			aria-label={`Data flow: ${block.title ?? ''}`}
			{...stylex.props(diagram.svg)}
		>
			<ArrowMarker />
			{block.edges.map((edge, index) => (
				<Edge
					key={keys[index]}
					domain={domain}
					edge={edge}
					nodes={layout.nodes}
				/>
			))}
			{block.nodes.map(node => (
				<DiagramNode
					key={node.id}
					domain={domain}
					box={{ ...placed(layout.nodes, node.id), ...FLOW_NODE }}
					label={node.label}
					refId={node.ref}
				/>
			))}
		</svg>
	)
}
