import { referenceStatus } from '@entities/review/guide/resolution'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../../chrome/context'

import { diagram } from './diagram.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { StaticStyle } from '@shared/lib/cx'
import type { KeyboardEvent, ReactElement } from 'react'

export type Box = { x: number; y: number; width: number; height: number }

const HALF = 2
const TEXT_BASELINE = 4

export function isActivation(event: KeyboardEvent<SVGElement>): boolean {
	return event.key === 'Enter' || event.key === ' '
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
		onKeyDown: (event: KeyboardEvent<SVGElement>): void => {
			if (!isActivation(event)) return
			event.preventDefault()
			activate()
		},
	}
}

// A node of any diagram: a labelled box; with a reference it is a button (pointer and keyboard both call followReference, the same validated action every chip uses), outlined in petrol and saying so.
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
			<text
				x={box.x + box.width / HALF}
				y={box.y + box.height / HALF + TEXT_BASELINE}
				textAnchor="middle"
				{...stylex.props(
					diagram.nodeText,
					link.isLinked && diagram.linkedText,
				)}
			>
				{label}
				{link.isLinked ? ' ↗' : ''}
			</text>
		</g>
	)
}
