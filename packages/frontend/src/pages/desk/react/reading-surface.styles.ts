import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const reading = stylex.create({
	// The reading takes the center and scrolls on its own, as the diff does in its place.
	surface: {
		flex: '1 1 auto',
		minWidth: 0,
		minHeight: 0,
		overflow: 'auto',
		backgroundColor: color['--paper'],
	},
})
