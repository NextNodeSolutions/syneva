import * as stylex from '@stylexjs/stylex'

import {
	FLOW_NODE,
	GAP_Y,
	LABEL_GAP,
	layoutFlow,
} from '../../layout/flow-layout'
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
import type { FlowRoute, Placed } from '../../layout/flow-layout'

const LABEL_BASELINE = 3
const HALF = 2
// A routed edge crosses a layer gap a quarter of the way in, clear of the direct edges' labels at the gap's middle.
const QUARTER = 4

function placed(nodes: readonly Placed[], id: string): Placed {
	return nodes.find(node => node.id === id) ?? { id, x: 0, y: 0 }
}

// An edge routed around the nodes: down into the gap under its source, across to its own gutter, along it to the gap over its target, then in from above. Its label sits beside the gutter.
function AroundEdge({
	domain,
	edge,
	from,
	to,
	gutter,
}: {
	domain: GuideDomain
	edge: FlowEdge
	from: Placed
	to: Placed
	gutter: number
}): ReactElement {
	const x1 = from.x + FLOW_NODE.width / HALF
	const y1 = from.y + FLOW_NODE.height
	const x2 = to.x + FLOW_NODE.width / HALF
	const below = y1 + GAP_Y / QUARTER
	const above = to.y - GAP_Y / QUARTER
	return (
		<g>
			<path
				d={`M${x1} ${y1} V ${below} H ${gutter} V ${above} H ${x2} V ${to.y}`}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				domain={domain}
				at={{
					x: gutter + LABEL_GAP,
					y: (below + above) / HALF + LABEL_BASELINE,
					anchor: 'start',
				}}
				label={edge.label}
			/>
		</g>
	)
}

// A dependency drawn top to bottom: a curve from the source's bottom edge to the target's top edge in the next layer, its label beside the bend; any other edge goes around.
function Edge({
	domain,
	edge,
	route,
	nodes,
}: {
	domain: GuideDomain
	edge: FlowEdge
	route: FlowRoute | undefined
	nodes: readonly Placed[]
}): ReactElement {
	const from = placed(nodes, edge.from)
	const to = placed(nodes, edge.to)
	if (route?.kind === 'around')
		return (
			<AroundEdge
				domain={domain}
				edge={edge}
				from={from}
				to={to}
				gutter={route.gutter}
			/>
		)
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
					route={layout.routes[index]}
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
