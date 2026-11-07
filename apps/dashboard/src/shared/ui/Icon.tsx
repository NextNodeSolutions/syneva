import * as stylex from '@stylexjs/stylex'
import { ICON_VIEW_BOX, ICONS } from '@syneva/design-system/icons'

import { icon } from './icon.styles'

import type { IconName } from '@syneva/design-system/icons'
import type { ReactElement } from 'react'

export function Icon({ name }: { name: IconName }): ReactElement {
	return (
		<svg
			{...stylex.props(icon.base)}
			viewBox={ICON_VIEW_BOX}
			aria-hidden="true"
		>
			<path d={ICONS[name]} />
		</svg>
	)
}
