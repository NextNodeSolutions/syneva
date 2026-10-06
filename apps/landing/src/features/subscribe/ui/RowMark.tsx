import * as stylex from '@stylexjs/stylex'

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
				<span {...stylex.props(sheetRow.refusedSquare)} />
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
				<svg {...stylex.props(sheetRow.check)} viewBox="0 0 20 20">
					<path d="m4 10.5 4 4 8-9" />
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
