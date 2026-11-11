import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

export const fileView = stylex.create({
	column: {
		display: 'grid',
		gridTemplateRows: 'auto minmax(0, 1fr)',
		minWidth: 0,
		minHeight: 0,
		backgroundColor: color['--white'],
	},
	scroller: {
		minHeight: 0,
		overflow: 'auto',
		lineHeight: 1.62,
		'--diffs-font-family': font['--mono'],
		'--diffs-header-font-family': font['--sans'],
		'--diffs-font-size': deskText.code,
	},
})
