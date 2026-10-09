import * as stylex from '@stylexjs/stylex'

import { edgeKeys } from '../../layout/keys'
import { layoutStates, position, STATE_NODE } from '../../layout/state-layout'

import { ARROW_END, ArrowMarker } from './arrow-marker'
import { DiagramNode } from './diagram-node'
import { diagram } from './diagram.styles'
import { EdgeLabel } from './edge-label'

import type {
	GuideDomain,
	StateBlock,
	StateNode,
	StateTransition,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { Placed } from '../../layout/flow-layout'

const BACK_DROP = 50
const LABEL_LIFT = 6
const HALF = 2

function placed(nodes: readonly Placed[], id: string): Placed {
	return nodes[position(nodes, id)] ?? { id, x: 0, y: 0 }
}

function shapeOf(state: StateNode): 'initial' | 'final' | undefined {
	if (state.isInitial) return 'initial'
	if (state.isFinal) return 'final'
	return undefined
}

// A transition back along the row loops under it.
function BackTransition({
	domain,
	transition,
	from,
	to,
}: {
	domain: GuideDomain
	transition: StateTransition
	from: Placed
	to: Placed
}): ReactElement {
	const x1 = from.x + STATE_NODE.width / HALF
	const x2 = to.x + STATE_NODE.width / HALF
	const base = from.y + STATE_NODE.height
	return (
		<g>
			<path
				d={`M${x1} ${base} C ${x1} ${base + BACK_DROP}, ${x2} ${base + BACK_DROP}, ${x2} ${base}`}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				domain={domain}
				at={{ x: (x1 + x2) / HALF, y: base + BACK_DROP + LABEL_LIFT }}
				label={transition.label}
				refId={transition.ref}
			/>
		</g>
	)
}

// A forward transition runs straight between neighbours.
function Transition({
	domain,
	transition,
	nodes,
}: {
	domain: GuideDomain
	transition: StateTransition
	nodes: readonly Placed[]
}): ReactElement {
	const from = placed(nodes, transition.from)
	const to = placed(nodes, transition.to)
	const isBack =
		position(nodes, transition.from) > position(nodes, transition.to)
	if (isBack)
		return (
			<BackTransition
				domain={domain}
				transition={transition}
				from={from}
				to={to}
			/>
		)
	const x1 = from.x + STATE_NODE.width
	const y = from.y + STATE_NODE.height / HALF
	return (
		<g>
			<line
				x1={x1}
				y1={y}
				x2={to.x}
				y2={y}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				domain={domain}
				at={{ x: (x1 + to.x) / HALF, y: y - LABEL_LIFT }}
				label={transition.label}
				refId={transition.ref}
			/>
		</g>
	)
}

export function StateDiagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: StateBlock
}): ReactElement {
	const layout = layoutStates(block)
	const keys = edgeKeys(block.transitions)
	return (
		<svg
			viewBox={`0 0 ${layout.width} ${layout.height}`}
			width={layout.width}
			height={layout.height}
			role="img"
			aria-label={`State diagram: ${block.title ?? ''}`}
			{...stylex.props(diagram.svg)}
		>
			<ArrowMarker />
			{block.transitions.map((transition, index) => (
				<Transition
					key={keys[index]}
					domain={domain}
					transition={transition}
					nodes={layout.nodes}
				/>
			))}
			{block.states.map(state => (
				<DiagramNode
					key={state.id}
					domain={domain}
					box={{ ...placed(layout.nodes, state.id), ...STATE_NODE }}
					label={state.label}
					refId={state.ref}
					shape={shapeOf(state)}
				/>
			))}
		</svg>
	)
}
