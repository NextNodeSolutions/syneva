import * as stylex from '@stylexjs/stylex'
import { dot } from '@syneva/design-system/controls.styles'
import { ARROW_VIEW_BOX, CHECK_PATH } from '@syneva/design-system/icons'

import { sheetRow } from './sheet-row.styles'

import type { ReactElement } from 'react'

// A field's state read like a diff line: open, an addition (+), refused, or joined (a human verdict, checked in green).
export type RowState = 'open' | 'added' | 'refused' | 'joined'

// The gutter's mark beside the line number; an open row shows its + only while its field has focus.
export function RowMark({
	state,
	order,
}: {
	state: RowState
	order: number
}): ReactElement {
	if (state === 'refused')
		return (
			<span {...stylex.props(sheetRow.mark, sheetRow.markShown)}>
				<span {...stylex.props(dot.base, dot.red)} />
			</span>
		)
	if (state === 'joined')
		return (
			<span
				{...stylex.props(
					sheetRow.mark,
					sheetRow.markJoined,
					sheetRow.stagger(order),
				)}
			>
				<svg {...stylex.props(sheetRow.check)} viewBox={ARROW_VIEW_BOX}>
					<path d={CHECK_PATH} />
				</svg>
			</span>
		)
	return (
		<span
			{...stylex.props(
				sheetRow.mark,
				state === 'added' && sheetRow.markShown,
			)}
		>
			+
		</span>
	)
}
