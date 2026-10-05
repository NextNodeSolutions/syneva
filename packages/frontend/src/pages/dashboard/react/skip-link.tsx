import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { DESKS_ID } from '../focus-targets'

import { skipLink } from './skip-link.styles'

import type { ReactElement } from 'react'

// The first stop of the tab order: straight to the listing, past the header and the head.
export function SkipLink(): ReactElement {
	return (
		<a href={`#${DESKS_ID}`} {...stylex.props(focus.ring, skipLink.root)}>
			Skip to the desks
		</a>
	)
}
