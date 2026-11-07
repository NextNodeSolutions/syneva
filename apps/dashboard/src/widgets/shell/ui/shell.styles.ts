import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The document never scrolls: the sidebar and the page each scroll on their own.
export const shell = stylex.create({
	frame: {
		display: 'grid',
		gridTemplateColumns: {
			default: '232px minmax(0, 1fr)',
			[media.stacked]: 'minmax(0, 1fr)',
		},
		gridTemplateRows: {
			default: 'minmax(0, 1fr)',
			[media.stacked]: 'auto minmax(0, 1fr)',
		},
		height: '100dvh',
		backgroundColor: color['--paper'],
	},
	page: {
		minWidth: 0,
		overflowY: 'auto',
	},
})
