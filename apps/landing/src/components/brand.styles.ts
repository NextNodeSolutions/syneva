import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/tokens/media.stylex'
import { ease } from '@syneva/tokens/tokens.stylex'

import { brandMarker, navMarker } from './navigation/markers.stylex'

const hover = (): string => stylex.when.ancestor(':hover', brandMarker)
const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', navMarker)

export const brand = stylex.create({
	link: {
		display: 'flex',
		alignItems: 'center',
		gap: '9px',
		fontSize: { default: '26px', [media.phone]: '24px' },
		fontWeight: 600,
		letterSpacing: '-.05em',
	},
	mark: {
		width: '26px',
		height: '26px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.8,
		transition: `transform .6s ${ease['--ease-spring']}`,
		transitionDuration: { default: null, [keyboard()]: '0s !important' },
		transitionDelay: { default: null, [keyboard()]: '0s !important' },
		transform: { default: null, [hover()]: 'rotate(45deg)' },
	},
})
