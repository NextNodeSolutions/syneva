import * as stylex from '@stylexjs/stylex'
import { Handle, Position } from '@xyflow/react'

import { hasFooter } from '../layout/element-size'

import { useCanvasFocus } from './canvas-focus'
import { ChangeTag } from './change-tag'
import { DomainNumbers } from './domain-numbers'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { node, tileChange } from './node.styles'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { Node, NodeProps } from '@xyflow/react'
import type { ReactElement } from 'react'

export type ElementData = { element: ModelElement }
export type ElementFlowNode = Node<ElementData, 'element'>
export type ContainerFlowNode = Node<ElementData, 'container'>

export function captionOf(element: ModelElement): string {
	return [KIND_WORDS[element.kind], element.technology]
		.filter(Boolean)
		.join(' · ')
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

// The tile's last row, for a part the change touches: what the change does, in words, then the numbers of the domains that make it.
function Footer({ element }: { element: ModelElement }): ReactElement | null {
	const focus = useCanvasFocus()
	if (!hasFooter(element)) return null
	return (
		<span {...stylex.props(node.footer)}>
			<ChangeTag change={element.change} css={node.tag} />
			<DomainNumbers
				domains={focus.domainsOf(element)}
				css={node.numbersEnd}
			/>
		</span>
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
					title={element.label}
					{...stylex.props(
						node.label,
						element.change === 'removed' && node.struck,
					)}
				>
					{element.label}
				</span>
			</span>
			<span {...stylex.props(node.caption)}>{captionOf(element)}</span>
			<Footer element={element} />
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
					<span
						title={element.label}
						{...stylex.props(node.containerName)}
					>
						{element.label}
					</span>
					<DomainNumbers domains={focus.domainsOf(element)} />
				</span>
				<span {...stylex.props(node.containerCaption)}>
					{captionOf(element)}
					<ChangeTag change={element.change} css={node.tag} />
				</span>
			</span>
		</div>
	)
}
