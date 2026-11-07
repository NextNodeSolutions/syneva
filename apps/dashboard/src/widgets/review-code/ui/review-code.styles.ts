import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { font } from '@syneva/design-system/tokens.stylex'

export const reviewCode = stylex.create({
	layout: {
		display: 'grid',
		gridTemplateColumns: {
			default: '260px minmax(0, 1fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		alignItems: 'start',
		gap: '24px',
	},
	diffs: {
		display: 'grid',
		gap: '16px',
		minWidth: 0,
		'--diffs-font-family': font['--mono'],
		'--diffs-header-font-family': font['--sans'],
	},
	file: {
		scrollMarginTop: '16px',
	},
})
