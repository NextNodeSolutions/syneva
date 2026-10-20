import * as stylex from '@stylexjs/stylex'

import { edgeKeys } from '../../layout/keys'
import { layoutStates, position, STATE_NODE } from '../../layout/state-layout'

import { ARROW_END, ArrowMarker } from './arrow-marker'
import { DiagramNode } from './diagram-node'
import { diagram } from './diagram.styles'
import { EdgeLabel } from './edge-label'

import type {
	StateBlock,
	StateNode,
	StateTransition,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { Placed } from '../../layout/flow-layout'
import type { StateRoute } from '../../layout/state-layout'
import type { DiagramRefs } from './diagram-refs'

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

// A transition on its own level: up (or down) from the source, along the level, back into the target, its label on the level.
function BracketTransition({
	refs,
	transition,
	route,
}: {
	refs: DiagramRefs
	transition: StateTransition
	route: Extract<StateRoute, { kind: 'bracket' }>
}): ReactElement {
	return (
		<g>
			<path
				d={`M${route.x1} ${route.edgeY} V ${route.lineY} H ${route.x2} V ${route.edgeY}`}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				refs={refs}
				at={{ x: (route.x1 + route.x2) / HALF, y: route.labelY }}
				label={transition.label}
				refId={transition.ref}
			/>
		</g>
	)
}

// A transition to the next state runs straight between the neighbours; the layout sends every other one around the row.
function Transition({
	refs,
	transition,
	route,
	nodes,
	nodeHeight,
}: {
	refs: DiagramRefs
	transition: StateTransition
	route: StateRoute | undefined
	nodes: readonly Placed[]
	nodeHeight: number
}): ReactElement {
	if (route?.kind === 'bracket')
		return (
			<BracketTransition
				refs={refs}
				transition={transition}
				route={route}
			/>
		)
	const from = placed(nodes, transition.from)
	const to = placed(nodes, transition.to)
	const x1 = from.x + STATE_NODE.width
	const y = from.y + nodeHeight / HALF
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
				refs={refs}
				at={{ x: (x1 + to.x) / HALF, y: y - LABEL_LIFT }}
				label={transition.label}
				refId={transition.ref}
			/>
		</g>
	)
}

export function StateDiagram({
	refs,
	block,
}: {
	refs: DiagramRefs
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
					refs={refs}
					transition={transition}
					route={layout.routes[index]}
					nodes={layout.nodes}
					nodeHeight={layout.nodeHeight}
				/>
			))}
			{block.states.map(state => (
				<DiagramNode
					key={state.id}
					refs={refs}
					box={{
						...placed(layout.nodes, state.id),
						width: STATE_NODE.width,
						height: layout.nodeHeight,
					}}
					label={state.label}
					refId={state.ref}
					shape={shapeOf(state)}
				/>
			))}
		</svg>
	)
}
