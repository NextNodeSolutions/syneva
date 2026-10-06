import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { rowMarker } from './signup.stylex'

const whileFocused = (): string =>
	stylex.when.ancestor(':focus-within', rowMarker)

// The hero headline's bands: a tint fading to a third of itself across the line.
const band = (tint: string): string =>
	`linear-gradient(90deg, ${tint}, color-mix(in srgb, ${tint} 35%, transparent))`

const STAGGER_MS = 90

const sweep = stylex.keyframes({
	from: { transform: 'scaleX(0)' },
	to: { transform: 'scaleX(1)' },
})

const pop = stylex.keyframes({
	from: { transform: 'scale(.4)', opacity: 0 },
	to: { transform: 'scale(1)', opacity: 1 },
})

export const sheetRow = stylex.create({
	root: {
		position: 'relative',
		isolation: 'isolate',
		display: 'grid',
		gridTemplateColumns: {
			default: '64px minmax(0, 1fr)',
			[media.phone]: '44px minmax(0, 1fr)',
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	// A row's band sweeps in from the gutter, as the agent's line does in the hero: on focus while it is edited, once on joining.
	band: {
		position: 'absolute',
		inset: 0,
		zIndex: -1,
		transformOrigin: 'left',
		backgroundImage: band(color['--wash']),
		transform: { default: 'scaleX(0)', [whileFocused()]: 'scaleX(1)' },
		transition: {
			default: null,
			[media.motionSafe]: `transform ${duration['--duration-shift']} ${ease['--ease-out']}`,
		},
	},
	bandRefused: {
		backgroundImage: band(color['--red-tint']),
		transform: 'scaleX(1)',
	},
	bandJoined: {
		backgroundImage: band(color['--mint']),
		transform: 'scaleX(1)',
		animationName: { default: null, [media.motionSafe]: sweep },
		animationDuration: '520ms',
		animationTimingFunction: ease['--ease-out'],
		animationFillMode: 'both',
	},
	gutter: {
		display: 'flex',
		// Phones stack the number over its mark: the column is too narrow for both on one line.
		flexDirection: { default: 'row', [media.phone]: 'column' },
		alignItems: { default: 'flex-start', [media.phone]: 'center' },
		justifyContent: {
			default: 'space-between',
			[media.phone]: 'flex-start',
		},
		gap: { default: null, [media.phone]: '6px' },
		paddingTop: '17px',
		paddingLeft: { default: '16px', [media.phone]: 0 },
		paddingRight: { default: '12px', [media.phone]: 0 },
		borderRightWidth: '1px',
		borderRightStyle: 'solid',
		borderRightColor: color['--line'],
		font: `400 11px/18px ${font['--mono']}`,
		color: color['--line-strong'],
	},
	mark: {
		display: 'grid',
		placeItems: 'center',
		width: '18px',
		height: '18px',
		font: `500 16px/1 ${font['--mono']}`,
		color: color['--accent'],
		opacity: { default: 0, [whileFocused()]: 1 },
		transition: {
			default: null,
			[media.motionSafe]: `opacity ${duration['--duration-fast']} ${ease['--ease-out']}`,
		},
	},
	markShown: { opacity: 1 },
	markJoined: {
		opacity: 1,
		animationName: { default: null, [media.motionSafe]: pop },
		animationDuration: duration['--duration-spring-medium'],
		animationTimingFunction: ease['--ease-spring'],
		animationFillMode: 'both',
	},
	// The joined rows check off one after the other.
	stagger: (order: number) => ({
		animationDelay: `${order * STAGGER_MS}ms`,
	}),
	refusedSquare: {
		width: '6px',
		height: '6px',
		backgroundColor: color['--red'],
	},
	check: {
		width: '16px',
		height: '16px',
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 2.4,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	body: {
		minWidth: 0,
		paddingTop: '14px',
		paddingBottom: '16px',
		paddingLeft: { default: '18px', [media.phone]: '14px' },
		paddingRight: { default: '22px', [media.phone]: '16px' },
	},
})
