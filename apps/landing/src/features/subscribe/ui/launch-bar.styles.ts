import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

export const launchBar = stylex.create({
	bar: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		paddingBlock: { default: '13px', [media.phone]: '11px' },
		paddingInline: { default: '20px', [media.phone]: '14px' },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		font: `11px/1.4 ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '10.5px' },
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--ink'],
	},
	status: { display: 'inline-flex', alignItems: 'center', gap: '10px' },
	square: {
		width: '7px',
		height: '7px',
		backgroundColor: color['--accent'],
		transition: `background-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
	},
	squareJoined: { backgroundColor: color['--green'] },
	aside: { color: color['--muted'], textAlign: 'right' },
})
