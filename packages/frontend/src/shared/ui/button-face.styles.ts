import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const buttonFace = stylex.create({
	arrowSmall: { width: '14px', height: '14px' },
	arrowBase: { width: '16px', height: '16px' },
	kbd: {
		marginRight: '-4px',
		display: { default: 'none', [media.finePointer]: 'inline-flex' },
	},
})
