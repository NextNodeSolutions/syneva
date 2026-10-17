import * as stylex from '@stylexjs/stylex'

import { lineKeys } from '../../layout/keys'
import { RefChip } from '../ref-chip'

import { CHANGE_WORDS } from './change-mark.styles'
import { diagram } from './diagram.styles'

import type {
	ChangeMark,
	DataModelBlock,
	ExplanationBlock,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'

type DiagramBlock = Extract<
	ExplanationBlock,
	{ kind: 'state' | 'sequence' | 'flow' | 'data-model' }
>

type Line = { text: string; refId?: string | undefined }

function labelOf(
	nodes: readonly { id: string; label: string }[],
	id: string,
): string {
	return nodes.find(node => node.id === id)?.label ?? id
}

// A node gets its own sentence when the edges would lose it: it links to code, carries a note, or no edge touches it.
function nodeLines(
	nodes: readonly {
		id: string
		label: string
		ref?: string | undefined
		note?: string | undefined
	}[],
	edges: readonly { from: string; to: string }[],
): Line[] {
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

// The diagram as sentences, its kept nodes then one per edge, in the block's order: what a screen reader and a reviewer without the drawing read, and what shows while the diagram chunk loads.
function lines(block: DiagramBlock): Line[] {
	if (block.kind === 'data-model') return modelLines(block)
	if (block.kind === 'state')
		return [
			...nodeLines(block.states, block.transitions),
			...edgeLines(block),
		]
	if (block.kind === 'flow')
		return [...nodeLines(block.nodes, block.edges), ...edgeLines(block)]
	return edgeLines(block)
}

function marked(text: string, change: ChangeMark | undefined): string {
	return change ? `${text} (${CHANGE_WORDS[change]})` : text
}

// Each entity with its fields and what the change does to them, then each relation.
function modelLines(block: DataModelBlock): Line[] {
	return [
		...block.entities.map(entity => ({
			text: `${marked(entity.label, entity.change)}: ${
				entity.fields
					.map(field =>
						marked(
							field.type
								? `${field.name} ${field.type}`
								: field.name,
							field.change,
						),
					)
					.join(', ') || 'no field shown'
			}`,
			refId: entity.ref,
		})),
		...block.relations.map(relation => ({
			text: marked(
				`${labelOf(block.entities, relation.from)} → ${labelOf(block.entities, relation.to)}${relation.cardinality ? ` ${relation.cardinality}` : ''}${relation.label ? ` (${relation.label})` : ''}`,
				relation.change,
			),
		})),
	]
}

function edgeLines(block: Exclude<DiagramBlock, DataModelBlock>): Line[] {
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

export function TextEquivalent({
	domain,
	block,
	isOpen = false,
}: {
	domain: GuideDomain
	block: DiagramBlock
	isOpen?: boolean
}): ReactElement {
	const refs = domain.references ?? []
	const sentences = lines(block)
	const keys = lineKeys(sentences)
	return (
		<details
			{...stylex.props(diagram.textEquivalent)}
			open={isOpen || undefined}
		>
			<summary {...stylex.props(diagram.textSummary)}>As text</summary>
			<ol {...stylex.props(diagram.textList)}>
				{sentences.map((line, index) => {
					const reference = refs.find(ref => ref.id === line.refId)
					return (
						<li key={keys[index]}>
							{line.text}
							{reference && (
								<>
									{' '}
									<RefChip
										domain={domain}
										reference={reference}
									/>
								</>
							)}
						</li>
					)
				})}
			</ol>
		</details>
	)
}
