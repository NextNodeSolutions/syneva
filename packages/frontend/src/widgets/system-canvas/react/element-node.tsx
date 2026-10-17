import * as stylex from '@stylexjs/stylex'
import { Handle, Position } from '@xyflow/react'

import { useCanvasFocus } from './canvas-focus'
import { ChangeTag } from './change-tag'
import { DomainBadges } from './domain-badges'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { node, tileChange } from './node.styles'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { Node, NodeProps } from '@xyflow/react'
import type { ReactElement } from 'react'

export type ElementData = { element: ModelElement }
export type ElementFlowNode = Node<ElementData, 'element'>
export type ContainerFlowNode = Node<ElementData, 'container'>

function Caption({ element }: { element: ModelElement }): ReactElement {
	const words = [KIND_WORDS[element.kind], element.technology]
		.filter(Boolean)
		.join(' · ')
	return (
		<span {...stylex.props(node.caption)}>
			<span {...stylex.props(node.captionText)}>{words}</span>
			<ChangeTag change={element.change} css={node.tag} />
		</span>
	)
}

// Links are drawn from ELK's route, so the handles only let React Flow accept them (system-canvas.css hides them).
function Handles(): ReactElement {
	return (
		<>
			<Handle
				type="target"
				position={Position.Left}
				isConnectable={false}
			/>
			<Handle
				type="source"
				position={Position.Right}
				isConnectable={false}
			/>
		</>
	)
}

export function ElementNode({
	id,
	data,
	selected,
}: NodeProps<ElementFlowNode>): ReactElement {
	const focus = useCanvasFocus()
	const { element } = data
	const tone = focus.toneOf(id)
	return (
		<div
			{...stylex.props(
				node.tile,
				element.change && tileChange[element.change],
				tone === 'lit' && node.lit,
				tone === 'dim' && node.dim,
				selected && node.selected,
			)}
		>
			<Handles />
			<span {...stylex.props(node.head)}>
				<KindGlyph kind={element.kind} css={node.glyph} />
				<span
					{...stylex.props(
						node.label,
						element.change === 'removed' && node.struck,
					)}
				>
					{element.label}
				</span>
			</span>
			<Caption element={element} />
			<DomainBadges domains={focus.domainsOf(element)} />
		</div>
	)
}

export function ContainerNode({
	id,
	data,
	selected,
}: NodeProps<ContainerFlowNode>): ReactElement {
	const focus = useCanvasFocus()
	const { element } = data
	const tone = focus.toneOf(id)
	return (
		<div
			{...stylex.props(
				node.container,
				element.change && tileChange[element.change],
				tone === 'lit' && node.containerLit,
				tone === 'dim' && node.dim,
				selected && node.containerSelected,
			)}
		>
			<Handles />
			<span
				{...stylex.props(
					node.containerHead,
					tone === 'lit' && node.containerHeadLit,
					selected && node.containerHeadSelected,
				)}
			>
				<span {...stylex.props(node.head)}>
					<KindGlyph kind={element.kind} css={node.glyph} />
					<span {...stylex.props(node.containerName)}>
						{element.label}
					</span>
					<DomainBadges
						domains={focus.domainsOf(element)}
						css={node.badgesInHead}
					/>
				</span>
				<Caption element={element} />
			</span>
		</div>
	)
}
