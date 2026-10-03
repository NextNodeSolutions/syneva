import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/tokens/media.stylex'
import { color, font } from '@syneva/tokens/tokens.stylex'

// The mono caption bar above a figure: what it shows, then what it is.
export const figureTop = stylex.create({
	bar: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: { default: '12px 22px', [media.phone]: '9px 14px' },
		gap: '20px',
		font: `11px ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '10.5px' },
		letterSpacing: '.02em',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		color: color['--ink'],
	},
	aside: { color: color['--muted'], textAlign: 'right' },
	liveDot: {
		display: 'inline-block',
		width: '6px',
		height: '6px',
		marginRight: '9px',
		backgroundColor: color['--signal'],
		verticalAlign: '1px',
	},
})
