import { use } from 'react'

import * as stylex from '@stylexjs/stylex'

import { labelAnchor, layoutGraph, routePath } from '../../layout/graph-layout'
import { edgeKeys } from '../../layout/keys'

import { ARROW_END, ArrowMarker } from './arrow-marker'
import { DiagramNode } from './diagram-node'
import { diagram } from './diagram.styles'
import { EdgeLabel } from './edge-label'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { GraphInput, LaidEdge, Rect } from '../../layout/graph-layout'

export type GraphNodeView = {
	id: string
	label: string
	refId?: string | undefined
	shape?: 'initial' | 'final' | undefined
}

function GraphEdge({
	domain,
	laid,
	label,
	refId,
}: {
	domain: GuideDomain
	laid: LaidEdge
	label: string | undefined
	refId: string | undefined
}): ReactElement {
	const at = labelAnchor(laid)
	return (
		<g>
			<path
				d={routePath(laid.points)}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			{at && (
				<EdgeLabel
					domain={domain}
					at={at}
					label={label}
					refId={refId}
				/>
			)}
		</g>
	)
}

function GraphNode({
	domain,
	node,
	box,
}: {
	domain: GuideDomain
	node: GraphNodeView
	box: Rect | undefined
}): ReactElement | null {
	if (!box) return null
	return (
		<DiagramNode
			domain={domain}
			box={box}
			label={node.label}
			refId={node.refId}
			shape={node.shape}
		/>
	)
}

// A node-and-edge diagram as ELK lays it out: the edges first, routed between the boxes, then the boxes over their ends. The layout suspends the block until it settles (a cached promise per graph), and a layout that fails throws to the block's boundary, which opens the text equivalent.
export function GraphDiagram({
	domain,
	input,
	nodes,
	edgeRefs,
	ariaLabel,
}: {
	domain: GuideDomain
	input: GraphInput
	nodes: readonly GraphNodeView[]
	edgeRefs?: readonly (string | undefined)[] | undefined
	ariaLabel: string
}): ReactElement {
	const layout = use(layoutGraph(input))
	const keys = edgeKeys(input.edges)
	return (
		<svg
			viewBox={`0 0 ${String(layout.width)} ${String(layout.height)}`}
			width={layout.width}
			height={layout.height}
			role="img"
			aria-label={ariaLabel}
			{...stylex.props(diagram.svg)}
		>
			<ArrowMarker />
			{layout.edges.map((laid, index) => (
				<GraphEdge
					key={keys[index]}
					domain={domain}
					laid={laid}
					label={input.edges[index]?.label}
					refId={edgeRefs?.[index]}
				/>
			))}
			{nodes.map(node => (
				<GraphNode
					key={node.id}
					domain={domain}
					node={node}
					box={layout.nodes.get(node.id)}
				/>
			))}
		</svg>
	)
}
