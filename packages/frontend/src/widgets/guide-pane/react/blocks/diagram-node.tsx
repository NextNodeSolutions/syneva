import { referenceStatus } from '@entities/review/guide/resolution'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../../chrome/context'
import { LINE_HEIGHT, nodeLines } from '../../layout/node-label'

import { diagram } from './diagram.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { StaticStyle } from '@shared/lib/cx'
import type { KeyboardEvent, ReactElement } from 'react'

export type Box = { x: number; y: number; width: number; height: number }

const HALF = 2
const TEXT_BASELINE = 4

function isActivation(event: KeyboardEvent<SVGElement>): boolean {
	return event.key === 'Enter' || event.key === ' '
}

// Enter or Space on an SVG control follows it, and the key stops there: the desk's own Enter (comment, jump to note) listens on the document and would run a second action after the jump.
export function onActivationKey(
	activate: () => void,
): (event: KeyboardEvent<SVGElement>) => void {
	return event => {
		if (!isActivation(event)) return
		event.preventDefault()
		event.stopPropagation()
		activate()
	}
}

type Link = {
	status: 'resolved' | 'stale' | 'unresolved' | null
	isLinked: boolean
}

function linkOf(domain: GuideDomain, refId: string | undefined): Link {
	const { S } = chromeCtx()
	const status = refId
		? referenceStatus(S.state, domain.id, refId).status
		: null
	return { status, isLinked: status !== null && status !== 'unresolved' }
}

function shapeStyles(
	link: Link,
	shape: 'initial' | 'final' | undefined,
): StaticStyle[] {
	return [
		diagram.nodeShape,
		link.isLinked && diagram.linkedShape,
		link.status === 'unresolved' && diagram.unresolvedShape,
		shape === 'initial' && diagram.initialShape,
		shape === 'final' && diagram.finalShape,
	]
}

function nodeLabel(
	label: string,
	refId: string | undefined,
	link: Link,
): string {
	if (!refId) return label
	return `${label}${link.isLinked ? ', opens the code' : ', target unresolved'}`
}

// The ARIA button a referenced element becomes: pointer and keyboard both call followReference, the same validated action every chip uses.
function buttonProps(
	domain: GuideDomain,
	refId: string | undefined,
	ariaLabel: string,
): Record<string, unknown> {
	if (typeof refId !== 'string') return {}
	const { S } = chromeCtx()
	const activate = (): void => S.followReference?.(domain.id, refId)
	return {
		role: 'button',
		tabIndex: 0,
		'aria-label': ariaLabel,
		'data-ref': `${domain.id}:${refId}`,
		onClick: activate,
		onKeyDown: onActivationKey(activate),
	}
}

// The label wrapped to its box, the lines centred on it as a block (the layout sized the box for them); a linked node's last line ends with its arrow.
function NodeText({
	box,
	label,
	isLinked,
}: {
	box: Box
	label: string
	isLinked: boolean
}): ReactElement {
	const lines = nodeLines(label, box.width)
	const centre = box.x + box.width / HALF
	const firstLine =
		box.y +
		box.height / HALF -
		((lines.length - 1) * LINE_HEIGHT) / HALF +
		TEXT_BASELINE
	return (
		<text
			y={firstLine}
			textAnchor="middle"
			{...stylex.props(diagram.nodeText, isLinked && diagram.linkedText)}
		>
			{lines.map((line, index) => (
				<tspan
					key={`${String(index)}:${line}`}
					x={centre}
					dy={index === 0 ? 0 : LINE_HEIGHT}
				>
					{line}
					{isLinked && index === lines.length - 1 ? ' ↗' : ''}
				</tspan>
			))}
		</text>
	)
}

// A node of any diagram: a labelled box, its label wrapped to the box; with a reference it is a button (pointer and keyboard both call followReference, the same validated action every chip uses), outlined in petrol and saying so.
export function DiagramNode({
	domain,
	box,
	label,
	refId,
	shape,
}: {
	domain: GuideDomain
	box: Box
	label: string
	refId?: string | undefined
	shape?: 'initial' | 'final' | undefined
}): ReactElement {
	const link = linkOf(domain, refId)
	return (
		<g
			{...stylex.props(link.isLinked && diagram.linked)}
			{...buttonProps(domain, refId, nodeLabel(label, refId, link))}
		>
			<rect
				x={box.x}
				y={box.y}
				width={box.width}
				height={box.height}
				{...stylex.props(shapeStyles(link, shape))}
			/>
			<NodeText box={box} label={label} isLinked={link.isLinked} />
		</g>
	)
}
