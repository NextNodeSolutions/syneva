import {
	CHANGE_SIGNS,
	CHANGE_WORDS,
	changeOutline,
	changeTone,
} from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../../chrome/context'

import { wire } from './wireframe.styles'

import type {
	GuideDomain,
	WireframeBlock,
	WireframeElement,
	WireframeNode,
} from '@entities/review/guide/model'
import type { StaticStyle } from '@shared/lib/cx'
import type { KeyboardEvent, ReactElement, ReactNode } from 'react'

// How each element draws: containers lay their children out in a column or a row, leaves draw their label in their own shape.
const STACKED = new Set<WireframeElement>([
	'screen',
	'sidebar',
	'main',
	'column',
	'card',
	'dialog',
	'list',
	'table',
])
const INLINE = new Set<WireframeElement>([
	'header',
	'footer',
	'row',
	'tabs',
	'item',
])

const SHAPES: Partial<Record<WireframeElement, StaticStyle>> = {
	screen: wire.screen,
	header: wire.header,
	footer: wire.footer,
	sidebar: wire.sidebar,
	main: wire.main,
	card: wire.card,
	dialog: wire.dialogBox,
	tabs: wire.tabs,
	table: wire.table,
	item: wire.item,
	title: wire.title,
	text: wire.text,
	button: wire.button,
	input: wire.input,
	select: wire.input,
	image: wire.image,
	badge: wire.badge,
	toast: wire.toast,
	divider: wire.divider,
}

function leafText(node: WireframeNode): string {
	const label = node.label ?? ''
	if (node.el === 'select') return `${label} ▾`
	if (node.el === 'checkbox') return `☐ ${label}`
	return label
}

// A sidebar beside its siblings: a container holding one lays out as a row whatever its own kind.
function layoutOf(node: WireframeNode): StaticStyle | false {
	const children = node.children ?? []
	if (children.some(child => child.el === 'sidebar')) return wire.split
	if (INLINE.has(node.el)) return wire.inline
	if (STACKED.has(node.el)) return wire.stack
	return false
}

function linkProps(
	domain: GuideDomain,
	refId: string | undefined,
): Record<string, unknown> {
	if (!refId) return {}
	const { S } = chromeCtx()
	const follow = (): void => S.followReference?.(domain.id, refId)
	return {
		role: 'button',
		tabIndex: 0,
		'data-ref': `${domain.id}:${refId}`,
		onClick: (event: { stopPropagation: () => void }) => {
			event.stopPropagation()
			follow()
		},
		onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
			if (event.key !== 'Enter' && event.key !== ' ') return
			event.preventDefault()
			event.stopPropagation()
			follow()
		},
	}
}

// A container's caption and children, or a leaf's words in its shape.
function ElementContent({
	domain,
	node,
}: {
	domain: GuideDomain
	node: WireframeNode
}): ReactNode {
	const children = node.children ?? []
	const isContainer = layoutOf(node) !== false || children.length > 0
	if (!isContainer) return leafText(node)
	return (
		<>
			{node.label && (
				<span {...stylex.props(wire.text)}>{node.label}</span>
			)}
			{children.map((child, index) => (
				<Element
					key={`${child.el}:${String(index)}`}
					domain={domain}
					node={child}
				/>
			))}
		</>
	)
}

function Element({
	domain,
	node,
}: {
	domain: GuideDomain
	node: WireframeNode
}): ReactElement {
	const { change } = node
	return (
		<div
			{...stylex.props(
				wire.el,
				SHAPES[node.el],
				layoutOf(node),
				change && changeOutline[change],
				change === 'removed' && wire.removed,
				Boolean(node.ref) && wire.link,
			)}
			data-el={node.el}
			title={change ? CHANGE_WORDS[change] : undefined}
			{...linkProps(domain, node.ref)}
		>
			{change && (
				<span
					{...stylex.props(wire.mark, changeTone[change])}
					aria-label={CHANGE_WORDS[change]}
				>
					{CHANGE_SIGNS[change]}
				</span>
			)}
			<ElementContent domain={domain} node={node} />
		</div>
	)
}

function Sketch({
	domain,
	label,
	node,
	surface,
}: {
	domain: GuideDomain
	label: string
	node: WireframeNode
	surface: NonNullable<WireframeBlock['surface']>
}): ReactElement {
	return (
		<div>
			<span {...stylex.props(wire.sideLabel)}>{label}</span>
			<div {...stylex.props(wire.surface, wire[surface])}>
				<Element domain={domain} node={node} />
			</div>
		</div>
	)
}

// The screen the change touches, before then after (after alone for a new screen), each element outlined by what the change does to it.
export function WireframeView({
	domain,
	block,
}: {
	domain: GuideDomain
	block: WireframeBlock
}): ReactElement {
	const surface = block.surface ?? 'desktop'
	return (
		<div {...stylex.props(wire.sides)}>
			{block.before && (
				<Sketch
					domain={domain}
					label="Before"
					node={block.before}
					surface={surface}
				/>
			)}
			<Sketch
				domain={domain}
				label={block.before ? 'After' : 'New screen'}
				node={block.after}
				surface={surface}
			/>
		</div>
	)
}
