import * as stylex from '@stylexjs/stylex'
import { ICON_VIEW_BOX } from '@syneva/design-system/icons'

import { SHELL_ICONS } from '../shell-icons'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'
import type { ShellIconName } from '../shell-icons'

const shellIcon = stylex.create({
	base: {
		flexShrink: 0,
		width: '16px',
		height: '16px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.6,
		strokeLinecap: 'square',
	},
})

// One of the shell's line icons at the navigation's size. Decoration: what it names is said
// beside it or in its control's accessible name.
export function ShellIcon({
	name,
	css,
}: {
	name: ShellIconName
	css?: Style | undefined
}): ReactElement {
	return (
		<svg
			{...stylex.props(shellIcon.base, css)}
			viewBox={ICON_VIEW_BOX}
			aria-hidden="true"
		>
			<path d={SHELL_ICONS[name]} />
		</svg>
	)
}
