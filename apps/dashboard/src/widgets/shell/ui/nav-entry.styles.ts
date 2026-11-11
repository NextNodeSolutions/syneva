import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const navEntry = stylex.create({
	link: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		height: '32px',
		paddingInline: '12px',
		whiteSpace: 'nowrap',
		color: color['--ink'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
		transition: `background-color ${transition.fast}`,
	},
	current: {
		color: color['--accent'],
		borderColor: color['--accent-line'],
		backgroundColor: color['--wash'],
	},
	label: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		color: color['--ink'],
	},
	count: {
		marginInlineStart: 'auto',
		fontFamily: font['--mono'],
		fontSize: '11px',
		fontVariantNumeric: 'tabular-nums',
		color: color['--muted'],
	},
})
