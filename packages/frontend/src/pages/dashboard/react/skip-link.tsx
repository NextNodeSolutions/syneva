import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { HUB_MAIN_ID } from '@widgets/hub-shell/react/hub-shell'

import { skipLink } from './skip-link.styles'

import type { ReactElement } from 'react'

export function SkipLink(): ReactElement {
	return (
		<a
			href={`#${HUB_MAIN_ID}`}
			{...stylex.props(focus.ring, skipLink.root)}
		>
			Skip to the page
		</a>
	)
}
