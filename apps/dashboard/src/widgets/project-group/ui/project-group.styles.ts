import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const projectGroup = stylex.create({
	group: {
		display: 'grid',
		gap: '10px',
	},
	head: {
		display: 'flex',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: '16px',
		paddingBottom: '8px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	name: {
		margin: 0,
		minWidth: 0,
		fontSize: '15px',
		fontWeight: 500,
		letterSpacing: '-.01em',
	},
	link: {
		textDecorationLine: { default: 'none', ':hover': 'underline' },
		textUnderlineOffset: '4px',
	},
})
