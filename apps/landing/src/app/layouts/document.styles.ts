import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const document = stylex.create({
	// A centered, ruled frame holds every page.
	frame: {
		maxWidth: '1280px',
		margin: '0 auto',
		borderInlineWidth: '1px',
		borderInlineStyle: 'solid',
		borderInlineColor: color['--line'],
		backgroundColor: color['--paper'],
	},
	skip: {
		position: 'fixed',
		top: { default: '-80px', ':focus': '10px' },
		left: '20px',
		padding: '12px',
		backgroundColor: color['--paper'],
		zIndex: 20,
	},
})
