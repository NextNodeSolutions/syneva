import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A number painted on a face keeps the plan's reference mark: ink on white in a strong hairline, petrol under the pointer.
export const faceNumber = stylex.create({
	plate: { cursor: 'pointer' },
	square: {
		fill: {
			default: color['--white'],
			':hover': color['--wash'],
		},
		stroke: color['--line-strong'],
		strokeWidth: 1,
	},
	text: {
		fill: color['--ink'],
		fontFamily: font['--mono'],
		fontSize: '14px',
		fontWeight: 600,
		textAnchor: 'middle',
		pointerEvents: 'none',
	},
})
