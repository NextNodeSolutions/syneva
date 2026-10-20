import * as stylex from '@stylexjs/stylex'

import { onActivationKey } from './diagram-node'
import { linkOf } from './diagram-refs'
import { diagram } from './diagram.styles'

import type { ReactElement } from 'react'
import type { DiagramRefs } from './diagram-refs'

// Where a label sits: its anchor point and whether the text is centred on it or starts there.
export type LabelSpot = { x: number; y: number; anchor?: 'middle' | 'start' }

// An edge's label; with a reference the label is the control, like a node.
export function EdgeLabel({
	refs,
	at,
	label,
	refId,
}: {
	refs: DiagramRefs
	at: LabelSpot
	label: string | undefined
	refId?: string | undefined
}): ReactElement | null {
	if (!label) return null
	const { isLinked } = linkOf(refs, refId)
	const activate = (): void => {
		if (refId) refs.follow(refId)
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
			onKeyDown={isLinked ? onActivationKey(activate) : undefined}
		>
			{label}
		</text>
	)
}
