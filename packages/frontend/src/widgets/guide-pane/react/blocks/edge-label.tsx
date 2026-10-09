import { referenceStatus } from '@entities/review/guide/resolution'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../../chrome/context'

import { isActivation } from './diagram-node'
import { diagram } from './diagram.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'

// Where a label sits: its anchor point and whether the text is centred on it or starts there.
export type LabelSpot = { x: number; y: number; anchor?: 'middle' | 'start' }

// An edge's label; with a reference the label is the control, like a node.
export function EdgeLabel({
	domain,
	at,
	label,
	refId,
}: {
	domain: GuideDomain
	at: LabelSpot
	label: string | undefined
	refId?: string | undefined
}): ReactElement | null {
	const { S } = chromeCtx()
	if (!label) return null
	const isLinked =
		!!refId &&
		referenceStatus(S.state, domain.id, refId).status !== 'unresolved'
	const activate = (): void => {
		if (refId) S.followReference?.(domain.id, refId)
	}
	return (
		<text
			x={at.x}
			y={at.y}
			textAnchor={at.anchor ?? 'middle'}
			{...stylex.props(
				diagram.edgeText,
				isLinked && diagram.edgeTextLinked,
				isLinked && diagram.linked,
			)}
			role={isLinked ? 'button' : undefined}
			tabIndex={isLinked ? 0 : undefined}
			onClick={isLinked ? activate : undefined}
			onKeyDown={
				isLinked
					? event => {
							if (!isActivation(event)) return
							event.preventDefault()
							activate()
						}
					: undefined
			}
		>
			{label}
		</text>
	)
}
