import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { ease } from '@syneva/design-system/tokens.stylex'

import { brandMarker, inputMarker } from './brand.stylex'

const hover = (): string => stylex.when.ancestor(':hover', brandMarker)
const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', inputMarker)

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
