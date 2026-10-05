import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const buttonFace = stylex.create({
	// The arrow follows the label's size: 14px beside a small label, 16px
	// beside a base or large one.
	arrowSmall: { width: '14px', height: '14px' },
	arrowBase: { width: '16px', height: '16px' },
	// A key hint only where there is a keyboard to press it (a fine pointer is
	// the closest signal CSS has); it sits tight against the tile's edge.
	kbd: {
		marginRight: '-4px',
		display: { default: 'none', [media.finePointer]: 'inline-flex' },
	},
})
