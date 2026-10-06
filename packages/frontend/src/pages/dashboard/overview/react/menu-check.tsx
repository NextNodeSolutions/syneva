import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { menu } from './menu.styles'

import type { ReactElement } from 'react'

// One square check in a panel: its label, and a count of what it holds when it has one.
export function MenuCheck({
	label,
	count,
	isChecked,
	onToggle,
}: {
	label: string
	count?: number | undefined
	isChecked: boolean
	onToggle: () => void
}): ReactElement {
	return (
		<label {...stylex.props(menu.row)}>
			<input
				type="checkbox"
				checked={isChecked}
				onChange={onToggle}
				{...stylex.props(focus.ring, menu.check)}
			/>
			{label}
			{typeof count === 'number' && (
				<span {...stylex.props(menu.rowCount)}>{count}</span>
			)}
		</label>
	)
}
