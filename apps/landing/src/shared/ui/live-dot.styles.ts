import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const liveDot = stylex.create({
	dot: {
		display: 'inline-block',
		width: '6px',
		height: '6px',
		marginRight: '9px',
		backgroundColor: color['--signal'],
		verticalAlign: '1px',
	},
})
