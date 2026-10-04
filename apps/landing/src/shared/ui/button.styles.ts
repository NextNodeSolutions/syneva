import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import { buttonMarker } from './actions.stylex'

const buttonHover = (): string => stylex.when.ancestor(':hover', buttonMarker)

// The petrol primary action, its arrow stepping forward on hover.
export const button = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: { default: '28px', [media.phone]: '14px' },
		minHeight: '52px',
		padding: { default: '12px 22px', [media.phone]: '11px 16px' },
		fontWeight: 500,
		fontSize: { default: '15px', [media.phone]: '14px' },
		transition: `background-color ${duration['--duration-fast']} ${ease['--ease-out']}, border-color ${duration['--duration-fast']} ${ease['--ease-out']}, transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, ':active': 'scale(.97)' },
	},
	primary: {
		color: color['--white'],
		backgroundColor: {
			default: color['--accent'],
			':hover': color['--accent-deep'],
		},
	},
	arrow: {
		width: '20px',
		height: '20px',
		stroke: 'currentColor',
		strokeWidth: 1.5,
		fill: 'none',
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, [buttonHover()]: 'translateX(3px)' },
	},
})
