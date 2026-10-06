import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const skipLink = stylex.create({
	root: {
		position: 'fixed',
		top: { default: '-80px', ':focus': '10px' },
		left: '20px',
		zIndex: 40,
		paddingBlock: '12px',
		paddingInline: '14px',
		backgroundColor: color['--paper'],
		color: color['--ink'],
		fontSize: '14px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
	},
})
