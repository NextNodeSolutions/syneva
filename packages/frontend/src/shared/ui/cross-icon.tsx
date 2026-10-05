import * as stylex from '@stylexjs/stylex'

import { crossIcon } from './cross-icon.styles'

import type { ReactElement } from 'react'

// The 12px cross of an icon-only dismiss or cancel; the button around it
// carries the name.
export function CrossIcon(): ReactElement {
	return (
		<svg
			{...stylex.props(crossIcon.base)}
			viewBox="0 0 12 12"
			aria-hidden="true"
		>
			<path d="M3 3l6 6M9 3l-6 6" />
		</svg>
	)
}
