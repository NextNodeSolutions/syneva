import { twoDigits } from '@shared/lib/two-digits'
import * as stylex from '@stylexjs/stylex'

import { RowMark } from './RowMark'
import { sheetRow } from './sheet-row.styles'
import { rowMarker } from './signup.stylex'

import type { ReactElement, ReactNode } from 'react'
import type { RowState } from './RowMark'

type SheetRowProps = {
	line: number
	state: RowState
	// The joined rows check off in this order.
	order?: number
	children: ReactNode
}

export function SheetRow({
	line,
	state,
	order = 0,
	children,
}: SheetRowProps): ReactElement {
	return (
		<div {...stylex.props(sheetRow.root, rowMarker)}>
			<span
				{...stylex.props(
					sheetRow.band,
					state === 'refused' && sheetRow.bandRefused,
					state === 'joined' && [
						sheetRow.bandJoined,
						sheetRow.stagger(order),
					],
				)}
				aria-hidden="true"
			/>
			<span {...stylex.props(sheetRow.gutter)} aria-hidden="true">
				<span>{twoDigits(line)}</span>
				<RowMark state={state} order={order} />
			</span>
			<div {...stylex.props(sheetRow.body)}>{children}</div>
		</div>
	)
}
