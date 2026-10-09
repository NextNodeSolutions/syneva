import * as stylex from '@stylexjs/stylex'

import { edgeKeys } from '../../layout/keys'
import { LANE, laneX, layoutSequence } from '../../layout/sequence-layout'

import { ARROW_END, ArrowMarker } from './arrow-marker'
import { DiagramNode } from './diagram-node'
import { diagram } from './diagram.styles'
import { EdgeLabel } from './edge-label'

import type {
	GuideDomain,
	SequenceBlock,
	SequenceParticipant,
	SequenceStep,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'

const TOP = 10
const SELF_LOOP = 40
const LABEL_LIFT = 6
const HALF = 2
const SELF_LABEL_DROP = 3

type Lanes = readonly { id: string; x: number }[]

// A message to the same lane: a loop out and back, its label beside it.
function SelfStep({
	domain,
	x,
	y,
	label,
	refId,
}: {
	domain: GuideDomain
	x: number
	y: number
	label: string
	refId: string | undefined
}): ReactElement {
	return (
		<g>
			<path
				d={`M${x} ${y - LABEL_LIFT} C ${x + SELF_LOOP} ${y - LABEL_LIFT}, ${x + SELF_LOOP} ${y + LABEL_LIFT}, ${x} ${y + LABEL_LIFT}`}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				domain={domain}
				at={{
					x: x + SELF_LOOP + LANE.headWidth / HALF,
					y: y + SELF_LABEL_DROP,
				}}
				label={label}
				refId={refId}
			/>
		</g>
	)
}

// One message: an arrow between two lanes, numbered in the order it happens.
function Step({
	domain,
	step,
	index,
	y,
	lanes,
}: {
	domain: GuideDomain
	step: SequenceStep
	index: number
	y: number
	lanes: Lanes
}): ReactElement {
	const x1 = laneX(lanes, step.from)
	const x2 = laneX(lanes, step.to)
	const label = `${index + 1}. ${step.label}`
	if (x1 === x2)
		return (
			<SelfStep
				domain={domain}
				x={x1}
				y={y}
				label={label}
				refId={step.ref}
			/>
		)
	return (
		<g>
			<line
				x1={x1}
				y1={y}
				x2={x2}
				y2={y}
				markerEnd={ARROW_END}
				{...stylex.props(diagram.edgePath)}
			/>
			<EdgeLabel
				domain={domain}
				at={{ x: (x1 + x2) / HALF, y: y - LABEL_LIFT }}
				label={label}
				refId={step.ref}
			/>
		</g>
	)
}

// A participant: its head and the lifeline every step crosses.
function Lane({
	domain,
	participant,
	x,
	height,
}: {
	domain: GuideDomain
	participant: SequenceParticipant
	x: number
	height: number
}): ReactElement {
	return (
		<g>
			<line
				x1={x}
				y1={TOP + LANE.headHeight}
				x2={x}
				y2={height}
				{...stylex.props(diagram.lifeline)}
			/>
			<DiagramNode
				domain={domain}
				box={{
					x: x - LANE.headWidth / HALF,
					y: TOP,
					width: LANE.headWidth,
					height: LANE.headHeight,
				}}
				label={participant.label}
			/>
		</g>
	)
}

export function SequenceDiagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: SequenceBlock
}): ReactElement {
	const layout = layoutSequence(block)
	const keys = edgeKeys(block.steps)
	return (
		<svg
			viewBox={`0 0 ${layout.width} ${layout.height}`}
			width={layout.width}
			height={layout.height}
			role="img"
			aria-label={`Sequence: ${block.title ?? ''}`}
			{...stylex.props(diagram.svg)}
		>
			<ArrowMarker />
			{block.participants.map(participant => (
				<Lane
					key={participant.id}
					domain={domain}
					participant={participant}
					x={laneX(layout.lanes, participant.id)}
					height={layout.height}
				/>
			))}
			{block.steps.map((step, index) => (
				<Step
					key={keys[index]}
					domain={domain}
					step={step}
					index={index}
					y={layout.stepY(index)}
					lanes={layout.lanes}
				/>
			))}
		</svg>
	)
}
