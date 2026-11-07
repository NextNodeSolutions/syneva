import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const statusMessage = stylex.create({
	box: {
		display: 'grid',
		gap: '6px',
		maxWidth: '560px',
	},
	title: {
		margin: 0,
		fontSize: '15px',
		fontWeight: 500,
		letterSpacing: '-.01em',
	},
	error: {
		color: color['--red'],
	},
	detail: {
		margin: 0,
		fontSize: '12.5px',
		lineHeight: 1.55,
		color: color['--muted'],
	},
})
