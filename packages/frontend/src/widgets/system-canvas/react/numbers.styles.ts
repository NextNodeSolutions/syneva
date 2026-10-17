import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A domain number is a small ruled square of mono ink, the size of a tag: it reads as a reference to follow, and turns petrol under the pointer like every way onward on the desk.
export const numbers = stylex.create({
	row: {
		display: 'inline-flex',
		flexWrap: 'nowrap',
		gap: '3px',
		flexShrink: 0,
	},
	number: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: '18px',
		height: '17px',
		paddingInline: '4px',
		backgroundColor: {
			default: color['--white'],
			':hover': color['--wash'],
		},
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		fontFamily: font['--mono'],
		fontSize: '10px',
		fontWeight: 500,
		lineHeight: 1,
		color: {
			default: color['--ink'],
			':hover': color['--accent'],
		},
		cursor: 'pointer',
	},
})
