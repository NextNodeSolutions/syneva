import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const churnCounts = stylex.create({
	counts: {
		display: 'inline-flex',
		gap: '5px',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		fontVariantNumeric: 'tabular-nums',
		whiteSpace: 'nowrap',
	},
	added: {
		color: color['--green'],
	},
	removed: {
		color: color['--red'],
	},
})
