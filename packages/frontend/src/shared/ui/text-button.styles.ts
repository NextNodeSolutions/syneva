import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A native button stripped to the text link it reads as: no tile, no padding, no rule (the
// three border longhands, since `border: 0` would reset the style and colour too). Merged
// after textLink, so the colour restates its hover, and its ink is set: a button does not take
// its sentence's colour the way a link does. Disabled, it keeps its place but takes no hover.
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
