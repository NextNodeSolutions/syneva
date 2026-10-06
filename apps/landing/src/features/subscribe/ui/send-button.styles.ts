import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { sendMarker } from './signup.stylex'

const sendHover = (): string => stylex.when.ancestor(':hover', sendMarker)

const turn = stylex.keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

export const sendButton = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '14px',
		flexShrink: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		fontFamily: font['--sans'],
		fontWeight: 500,
		color: color['--white'],
		backgroundColor: {
			default: color['--accent'],
			':hover': color['--accent-deep'],
		},
		cursor: { default: 'pointer', ':disabled': 'progress' },
	},
	icon: {
		flexShrink: 0,
		width: '18px',
		height: '18px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	arrow: {
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, [sendHover()]: 'translateX(3px)' },
	},
	// While the signup is on its way the mark turns in the arrow's place, as the header's does with the scroll.
	turning: {
		animationName: { default: null, [media.motionSafe]: turn },
		animationDuration: '1.4s',
		animationTimingFunction: 'linear',
		animationIterationCount: 'infinite',
	},
})
