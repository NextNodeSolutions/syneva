import { frame } from '@shared/ui/frame.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

export const reviewDesk = stylex.create({
	desk: {
		display: 'grid',
		gridTemplateRows: `${frame.barHeight} minmax(0, 1fr)`,
		height: '100%',
		minWidth: 0,
		backgroundColor: color['--paper'],
		color: color['--ink'],
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		lineHeight: 1.5,
		outline: 'none',
	},
	empty: {
		padding: '32px',
	},
})
