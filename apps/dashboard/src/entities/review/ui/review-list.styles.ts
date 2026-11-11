import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const reviewList = stylex.create({
	list: {
		margin: 0,
		padding: 0,
		listStyle: 'none',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
	},
	item: {
		borderTopWidth: { default: '1px', ':first-child': 0 },
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	empty: {
		margin: 0,
		paddingBlock: '14px',
		paddingInline: '16px',
		fontSize: '12.5px',
		color: color['--muted'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
	},
})
