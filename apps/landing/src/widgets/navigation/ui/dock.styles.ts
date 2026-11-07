import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { navMarker } from './markers.stylex'
import { dockClock, navDock } from './nav.stylex'

// Every pose below is the docked one under data-docked (written by header-dock.ts); data-dock-instant takes a page that loads already scrolled straight to it.
const docked = (): string =>
	stylex.when.ancestor('[data-docked="true"]', navMarker)
const instant = (): string =>
	stylex.when.ancestor('[data-dock-instant]', navMarker)

const TOP = navDock['--dock-top']
const HEIGHT = navDock['--dock-height']
const INSET = navDock['--dock-inset']
const RADIUS = navDock['--dock-radius']
const STANDOFF = '5px'
const CORNER = '9px'
const CORNER_STROKE = '1.5px'

const DOCK = dockClock.dockDuration
const UNDOCK = dockClock.undockDuration
const SETTLE = dockClock.settleDelay
const EASE = dockClock.ease
const LOCK = dockClock.lockEase

type DockValue = { readonly default: string | null } & Readonly<
	Record<string, string | null>
>

// A transition runs on the list of the state it heads to, so letting go is faster than locking on.
const travel = (
	dock: string,
	undock: string,
): Record<
	'transition' | 'transitionDuration' | 'transitionDelay',
	DockValue
> => ({
	transition: { default: undock, [docked()]: dock },
	transitionDuration: { default: null, [instant()]: '0s !important' },
	transitionDelay: { default: null, [instant()]: '0s !important' },
})

// On phones the sheet keeps too thin a margin for the corners to rest in: they lock on, hold a beat and fade, a registration flash.
const flash = stylex.keyframes({
	'0%': { opacity: 0 },
	'12%': { opacity: 1 },
	'70%': { opacity: 1 },
	'100%': { opacity: 0 },
})

const lifted = `0 1px 2px color-mix(in srgb, ${color['--ink']} 5%, transparent), 0 14px 32px -16px color-mix(in srgb, ${color['--ink']} 24%, transparent)`

const cornerTravel = (x: string, y: string): { transform: DockValue } => ({
	transform: {
		default: `translate(calc(${x} * ${INSET}), calc(${y} * ${TOP}))`,
		[docked()]: 'none',
	},
})

export const dock = stylex.create({
	layer: {
		position: 'absolute',
		inset: 0,
		zIndex: -1,
		pointerEvents: 'none',
	},
	// It takes the pointer between the header's controls, so a pass across it never reads as leaving the header.
	sheet: {
		position: 'absolute',
		top: TOP,
		left: INSET,
		right: INSET,
		height: HEIGHT,
		borderRadius: RADIUS,
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		backgroundColor: stylex.firstThatWorks<string>(
			`color-mix(in srgb, ${color['--paper']} 90%, transparent)`,
			color['--paper'],
		),
		backdropFilter: 'blur(16px) saturate(1.4)',
		boxShadow: lifted,
		opacity: { default: 0, [docked()]: 1 },
		transform: { default: 'scale(1.02, 1.24)', [docked()]: 'none' },
		pointerEvents: { default: null, [docked()]: 'auto' },
		...travel(
			`opacity 140ms ${EASE}, transform ${DOCK} ${EASE}`,
			`opacity 180ms ${EASE}, transform ${UNDOCK} ${EASE}`,
		),
	},
	rule: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '1px',
		backgroundColor: {
			default: color['--line'],
			[docked()]: color['--accent'],
		},
		transform: {
			default: 'none',
			[docked()]: `translateY(calc(-1 * ${TOP}))`,
		},
		clipPath: {
			default: 'inset(0 0)',
			[docked()]: `inset(0 calc(${INSET} + ${RADIUS}))`,
		},
		opacity: { default: 1, [docked()]: 0 },
		...travel(
			`transform ${DOCK} ${EASE}, clip-path ${DOCK} ${EASE}, background-color 120ms ${EASE}, opacity 220ms ${EASE} ${SETTLE}`,
			`transform ${UNDOCK} ${EASE}, clip-path ${UNDOCK} ${EASE}`,
		),
	},
	corner: {
		position: 'absolute',
		width: CORNER,
		height: CORNER,
		borderStyle: 'solid',
		borderWidth: 0,
		borderColor: {
			default: color['--accent'],
			[docked()]: color['--line-strong'],
		},
		opacity: {
			default: 0,
			[docked()]: 1,
			[media.navToggle]: { default: 0, [docked()]: 0 },
		},
		animationName: {
			default: null,
			[media.navToggle]: { default: null, [docked()]: flash },
		},
		animationDuration: {
			default: null,
			[media.navToggle]: { default: null, [docked()]: '900ms' },
		},
		animationTimingFunction: {
			default: null,
			[media.navToggle]: { default: null, [docked()]: EASE },
		},
		...travel(
			`transform ${DOCK} ${LOCK}, opacity 120ms ${EASE}, border-color 420ms ${EASE} ${SETTLE}`,
			`transform ${UNDOCK} ${EASE}, opacity ${UNDOCK} ${EASE}`,
		),
	},
	topLeft: {
		top: `calc(${TOP} - ${STANDOFF})`,
		left: `calc(${INSET} - ${STANDOFF})`,
		borderTopWidth: CORNER_STROKE,
		borderLeftWidth: CORNER_STROKE,
		...cornerTravel('-1', '-1'),
	},
	topRight: {
		top: `calc(${TOP} - ${STANDOFF})`,
		right: `calc(${INSET} - ${STANDOFF})`,
		borderTopWidth: CORNER_STROKE,
		borderRightWidth: CORNER_STROKE,
		...cornerTravel('1', '-1'),
	},
	bottomLeft: {
		top: `calc(${TOP} + ${HEIGHT} + ${STANDOFF} - ${CORNER})`,
		left: `calc(${INSET} - ${STANDOFF})`,
		borderBottomWidth: CORNER_STROKE,
		borderLeftWidth: CORNER_STROKE,
		...cornerTravel('-1', '1'),
	},
	bottomRight: {
		top: `calc(${TOP} + ${HEIGHT} + ${STANDOFF} - ${CORNER})`,
		right: `calc(${INSET} - ${STANDOFF})`,
		borderBottomWidth: CORNER_STROKE,
		borderRightWidth: CORNER_STROKE,
		...cornerTravel('1', '1'),
	},
	// The sheet's bottom edge rules the reading position, as the desk's overview ruler does a file: a petrol line as far as you have read, a tick where each section starts (header-dock.ts places them).
	ruler: {
		position: 'absolute',
		left: `calc(${RADIUS} + 8px)`,
		right: `calc(${RADIUS} + 8px)`,
		bottom: '-1px',
		height: '1px',
	},
	progress: {
		position: 'absolute',
		inset: 0,
		backgroundColor: color['--accent'],
		transformOrigin: 'left',
		transform: 'scaleX(0)',
	},
	tick: {
		position: 'absolute',
		bottom: 0,
		left: 'calc(var(--at) * 100%)',
		width: '1px',
		height: '5px',
		backgroundColor: {
			default: color['--line-strong'],
			':is([data-passed])': color['--accent'],
		},
		transition: `background-color 300ms ${EASE}`,
	},
})
