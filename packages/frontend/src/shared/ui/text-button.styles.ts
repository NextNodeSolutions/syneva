import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const textButton = stylex.create({
	base: {
		appearance: 'none',
		boxSizing: 'border-box',
		justifyContent: 'center',
		margin: 0,
		paddingBlock: 0,
		paddingInline: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		backgroundColor: 'transparent',
		fontFamily: font['--sans'],
		fontWeight: 400,
		lineHeight: 1.2,
		whiteSpace: 'nowrap',
		color: { default: color['--ink'], ':hover': color['--accent'] },
		cursor: { default: 'pointer', ':disabled': 'default' },
		opacity: { default: null, ':disabled': 0.55 },
		pointerEvents: { default: null, ':disabled': 'none' },
	},
})
