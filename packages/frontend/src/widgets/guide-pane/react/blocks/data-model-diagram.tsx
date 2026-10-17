import { use } from 'react'

import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../../chrome/context'
import { layoutGraph } from '../../layout/graph-layout'
import { edgeKeys } from '../../layout/keys'

import { ArrowMarker } from './arrow-marker'
import {
	CHANGE_SIGNS,
	CHANGE_WORDS,
	changeFill,
	changeStroke,
} from './change-mark.styles'
import { onActivationKey } from './diagram-node'
import { diagram } from './diagram.styles'
import { GraphEdge } from './graph-diagram'

import type {
	DataEntity,
	DataField,
	DataModelBlock,
	DataRelation,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { GraphInput, Rect } from '../../layout/graph-layout'

const ENTITY_WIDTH = 210
const HEAD = 24
const ROW = 17
const FOOT = 6
const PAD = 8
const SIGN_WIDTH = 10
const BASELINE = 12
const TYPE_CHARS = 14

function entityHeight(entity: DataEntity): number {
	return HEAD + Math.max(1, entity.fields.length) * ROW + FOOT
}

function relationLabel(relation: DataRelation): string | undefined {
	const parts = [relation.cardinality, relation.label].filter(Boolean)
	if (!parts.length) return undefined
	return parts.join(' ')
}

function modelGraph(block: DataModelBlock): GraphInput {
	return {
		direction: 'DOWN',
		nodes: block.entities.map(entity => ({
			id: entity.id,
			width: ENTITY_WIDTH,
			height: entityHeight(entity),
		})),
		edges: block.relations.map(relation => ({
			from: relation.from,
			to: relation.to,
			label: relationLabel(relation),
		})),
	}
}

function clip(text: string, chars: number): string {
	return text.length > chars ? `${text.slice(0, chars - 1)}…` : text
}

// One field row: the sign of what the change does to it, its name (struck through when removed), its type at the right edge.
function FieldRow({
	field,
	box,
	index,
}: {
	field: DataField
	box: Rect
	index: number
}): ReactElement {
	const y = box.y + HEAD + index * ROW + BASELINE
	const { change } = field
	return (
		<g>
			{field.note && <title>{field.note}</title>}
			{change && (
				<text
					x={box.x + PAD}
					y={y}
					{...stylex.props(diagram.fieldSign, changeFill[change])}
					aria-label={CHANGE_WORDS[change]}
				>
					{CHANGE_SIGNS[change]}
				</text>
			)}
			<text
				x={box.x + PAD + SIGN_WIDTH}
				y={y}
				{...stylex.props(
					diagram.fieldName,
					change === 'removed' && diagram.struck,
				)}
			>
				{field.name}
			</text>
			{field.type && (
				<text
					x={box.x + box.width - PAD}
					y={y}
					textAnchor="end"
					{...stylex.props(diagram.fieldType)}
				>
					{clip(field.type, TYPE_CHARS)}
				</text>
			)}
		</g>
	)
}

function headProps(
	domain: GuideDomain,
	entity: DataEntity,
): Record<string, unknown> {
	const refId = entity.ref
	if (!refId) return {}
	const { S } = chromeCtx()
	const activate = (): void => S.followReference?.(domain.id, refId)
	return {
		role: 'button',
		tabIndex: 0,
		'aria-label': `${entity.label}, opens the code`,
		'data-ref': `${domain.id}:${refId}`,
		onClick: activate,
		onKeyDown: onActivationKey(activate),
	}
}

// The entity's head: its name (a link when it cites code, struck through when removed) and what the change does to it.
function EntityHead({
	domain,
	entity,
	box,
}: {
	domain: GuideDomain
	entity: DataEntity
	box: Rect
}): ReactElement {
	const { change } = entity
	const isLinked = Boolean(entity.ref)
	return (
		<g
			{...stylex.props(isLinked && diagram.linked)}
			{...headProps(domain, entity)}
		>
			<rect
				x={box.x}
				y={box.y}
				width={box.width}
				height={HEAD}
				{...stylex.props(diagram.entityHead)}
			/>
			<text
				x={box.x + PAD}
				y={box.y + HEAD - PAD}
				{...stylex.props(
					diagram.entityName,
					isLinked && diagram.linkedText,
					change === 'removed' && diagram.struck,
				)}
			>
				{entity.label}
				{isLinked ? ' \u2197' : ''}
			</text>
			{change && (
				<text
					x={box.x + box.width - PAD}
					y={box.y + HEAD - PAD}
					textAnchor="end"
					{...stylex.props(diagram.entityChange, changeFill[change])}
				>
					{CHANGE_WORDS[change]}
				</text>
			)}
		</g>
	)
}

// An entity as a table card: its head, then one row per field; an entity the layout did not place draws nothing.
function EntityBox({
	domain,
	entity,
	box,
}: {
	domain: GuideDomain
	entity: DataEntity
	box: Rect | undefined
}): ReactElement | null {
	if (!box) return null
	const { change } = entity
	return (
		<g data-entity={entity.id}>
			<rect
				x={box.x}
				y={box.y}
				width={box.width}
				height={box.height}
				{...stylex.props(
					diagram.nodeShape,
					change && changeStroke[change],
				)}
			/>
			<EntityHead domain={domain} entity={entity} box={box} />
			{entity.fields.map((field, index) => (
				<FieldRow
					key={field.name}
					field={field}
					box={box}
					index={index}
				/>
			))}
		</g>
	)
}

// Tables or types stacked down the explanation's column, their relations routed between them with the cardinality on the line.
export function DataModelDiagram({
	domain,
	block,
}: {
	domain: GuideDomain
	block: DataModelBlock
}): ReactElement {
	const input = modelGraph(block)
	const layout = use(layoutGraph(input))
	const keys = edgeKeys(input.edges)
	return (
		<svg
			viewBox={`0 0 ${String(layout.width)} ${String(layout.height)}`}
			width={layout.width}
			height={layout.height}
			role="img"
			aria-label={`Data model: ${block.title ?? ''}`}
			{...stylex.props(diagram.svg)}
		>
			<ArrowMarker />
			{layout.edges.map((laid, index) => (
				<GraphEdge
					key={keys[index]}
					domain={domain}
					laid={laid}
					label={input.edges[index]?.label}
					change={block.relations[index]?.change}
				/>
			))}
			{block.entities.map(entity => (
				<EntityBox
					key={entity.id}
					domain={domain}
					entity={entity}
					box={layout.nodes.get(entity.id)}
				/>
			))}
		</svg>
	)
}
