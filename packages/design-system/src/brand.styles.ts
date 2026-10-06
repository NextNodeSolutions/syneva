import * as stylex from '@stylexjs/stylex'

import { brandMarker } from './brand.stylex'
import { media } from './media.stylex'
import { ease } from './tokens.stylex'

const linkHover = (): string => stylex.when.ancestor(':hover', brandMarker)

// The wordmark in 600 (the only place that weight appears); the link carries brandMarker,
// so the mark turns a quarter-diamond under the pointer.
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
		transform: { default: null, [linkHover()]: 'rotate(45deg)' },
	},
})
