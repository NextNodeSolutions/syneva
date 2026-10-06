import * as stylex from '@stylexjs/stylex'
import { ICON_VIEW_BOX, ICONS } from '@syneva/design-system/icons'

import { lineIcon } from './line-icon.styles'

import type { Style } from '@shared/lib/cx'
import type { IconName } from '@syneva/design-system/icons'
import type { ReactElement } from 'react'

export function LineIcon({
	name,
	css,
}: {
	name: IconName
	css: Style
}): ReactElement {
	return (
		<svg
			{...stylex.props(lineIcon.base, css)}
			viewBox={ICON_VIEW_BOX}
			aria-hidden="true"
		>
			<path d={ICONS[name]} />
		</svg>
	)
}
