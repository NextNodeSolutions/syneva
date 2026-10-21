import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { pageInset } from '../react/page.stylex'

// A plan's page in bands, as the RFC pages are: each one across the page, ruled under, its
// content in a centred frame. The frame's width keeps the reading in front of the reviewer on a
// wide screen instead of along the sidebar's edge.
export const planBand = stylex.create({
	band: {
		paddingTop: '52px',
		paddingBottom: '56px',
		paddingInline: pageInset.gutter,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		scrollMarginTop: '8px',
	},
	frame: { maxWidth: '1180px', marginInline: 'auto' },
})
