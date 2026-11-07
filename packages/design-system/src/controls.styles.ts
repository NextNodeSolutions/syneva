import * as stylex from '@stylexjs/stylex'

import { controlMarker } from './controls.stylex'
import { media } from './media.stylex'
import { color, ease, font } from './tokens.stylex'
import { transition } from './transitions.stylex'

// App controls at application density (no radius, 1px rules, petrol action, mono for typed/counted text).
// Compose a control as [press.control, control.base, control.<tone>, control.<size>?]; add controlMarker when it carries an arrow.

const controlHover = (): string => stylex.when.ancestor(':hover', controlMarker)

const focusRing = {
	outlineWidth: { default: null, ':focus-visible': '2px' },
	outlineStyle: { default: null, ':focus-visible': 'solid' },
	outlineColor: { default: null, ':focus-visible': color['--accent'] },
	outlineOffset: '2px',
} as const

export const focus = stylex.create({
	ring: focusRing,
	inset: { ...focusRing, outlineOffset: '-2px' }, // inset: for elements whose surroundings would clip an outside ring
})

// A tone's colour at rest and under the pointer, a fine pointer's only: a tap leaves a sticky
// :hover behind on touch screens, which would read as the control's chosen or active state.
type Hovered = {
	default: string
	[key: string]: string | { default: string; ':hover': string }
}

const hovered = (rest: string, hover: string): Hovered => ({
	default: rest,
	[media.finePointer]: { default: rest, ':hover': hover },
})

export const control = stylex.create({
	base: {
		...focusRing,
		// No shared sheet reset: these hold the 1px border without shifting layout.
		boxSizing: 'border-box',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
		minHeight: '36px',
		paddingBlock: '7px',
		paddingInline: '14px',
		fontFamily: font['--sans'],
		fontSize: '13px',
		fontWeight: 500,
		lineHeight: 1.2,
		letterSpacing: '-.005em',
		whiteSpace: 'nowrap',
		textDecoration: 'none',
		borderWidth: '1px',
		borderStyle: 'solid',
		cursor: { default: 'pointer', ':disabled': 'default' },
		opacity: { default: null, ':disabled': 0.55 },
		pointerEvents: { default: null, ':disabled': 'none' },
		transition: `color ${transition.fast}, background-color ${transition.fast}, border-color ${transition.fast}, transform ${transition.fast}`,
	},
	primary: {
		color: color['--white'],
		backgroundColor: hovered(color['--accent'], color['--accent-deep']),
		borderColor: hovered(color['--accent'], color['--accent-deep']),
	},
	outlined: {
		color: hovered(color['--ink'], color['--accent']),
		backgroundColor: hovered(color['--white'], color['--wash']),
		borderColor: hovered(color['--line-strong'], color['--accent']),
	},
	quiet: {
		color: hovered(color['--muted'], color['--ink']),
		backgroundColor: hovered('transparent', color['--field']),
		borderColor: 'transparent',
	},
	// Armed destructive actions only (an armed close, a discard).
	danger: {
		color: color['--white'],
		backgroundColor: hovered(color['--red'], color['--red-deep']),
		borderColor: hovered(color['--red'], color['--red-deep']),
	},
	small: {
		minHeight: '30px',
		paddingBlock: '5px',
		paddingInline: '10px',
		fontSize: '12.5px',
		gap: '6px',
	},
	large: {
		minHeight: { default: '44px', [media.phone]: '42px' },
		paddingInline: '18px',
		fontSize: '14px',
		gap: '14px',
	},
	square: { paddingInline: 0, aspectRatio: '1' },
	block: { width: '100%' },
	// Requires controlMarker on the control: the arrow steps forward only under it.
	arrow: {
		display: 'inline-block',
		transition: `transform ${transition.fast}`,
		transform: { default: null, [controlHover()]: 'translateX(3px)' },
	},
})

export const field = stylex.create({
	base: {
		boxSizing: 'border-box',
		display: 'block',
		width: '100%',
		minHeight: '40px',
		paddingBlock: '9px',
		paddingInline: '12px',
		fontFamily: font['--sans'],
		fontSize: '14px',
		lineHeight: 1.4,
		color: color['--ink'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--muted'],
			':focus': color['--accent'],
		},
		borderRadius: 0,
		outline: 'none',
		boxShadow: { default: null, ':focus': `0 0 0 3px ${color['--wash']}` },
		caretColor: color['--accent'],
		transition: `border-color ${transition.fast}, box-shadow ${transition.fast}`,
		'::placeholder': { color: color['--muted'], opacity: 0.75 },
	},
	mono: { fontFamily: font['--mono'], fontSize: '13px' },
	invalid: {
		borderColor: {
			default: color['--red'],
			':hover': color['--red'],
			':focus': color['--red'],
		},
		boxShadow: {
			default: null,
			':focus': `0 0 0 3px ${color['--red-tint']}`,
		},
	},
	// appearance: none drops the platform arrow: selectBox carries a drawn chevron, stroked with --muted so themes recolour it.
	select: {
		appearance: 'none',
		paddingRight: '36px',
		cursor: 'pointer',
	},
	selectBox: { position: 'relative', display: 'block' },
	chevron: {
		position: 'absolute',
		top: '50%',
		right: '12px',
		width: '12px',
		height: '12px',
		marginTop: '-6px',
		pointerEvents: 'none',
		fill: 'none',
		stroke: color['--muted'],
		strokeWidth: 1.3,
	},
})

export const caption = stylex.create({
	base: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		fontWeight: 400,
		letterSpacing: '.02em',
		color: color['--muted'],
	},
	upper: { textTransform: 'uppercase', letterSpacing: '.08em' },
})

// Tone meanings: petrol = the agent's work and the reviewer's questions, green = a verdict, amber = a requested change, red = what goes, neutral = a plain kind.
export const tag = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		paddingBlock: '2px',
		paddingInline: '6px',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		fontWeight: 500,
		fontStyle: 'normal',
		lineHeight: 1.5,
		letterSpacing: '.04em',
		whiteSpace: 'nowrap',
	},
	accent: { color: color['--accent'], backgroundColor: color['--wash'] },
	green: { color: color['--green'], backgroundColor: color['--mint'] },
	amber: { color: color['--amber'], backgroundColor: color['--amber-tint'] },
	red: { color: color['--red'], backgroundColor: color['--red-tint'] },
	neutral: { color: color['--muted'], backgroundColor: color['--field'] },
})

const pulse = stylex.keyframes({
	'0%': { opacity: 1 },
	'50%': { opacity: 0.35 },
	'100%': { opacity: 1 },
})

// Tone paints currentColor, so tone keys recolour it and `hollow` outlines any tone instead of filling.
export const dot = stylex.create({
	base: {
		display: 'inline-block',
		flexShrink: 0,
		width: '7px',
		height: '7px',
		color: color['--line-strong'],
		backgroundColor: 'currentColor',
	},
	accent: { color: color['--signal'] },
	petrol: { color: color['--accent'] },
	green: { color: color['--green'] },
	amber: { color: color['--amber'] },
	red: { color: color['--red'] },
	// Something sent or awaited rather than held: an outline in the tone.
	hollow: {
		backgroundColor: 'transparent',
		boxShadow: 'inset 0 0 0 1px currentColor',
	},
	live: {
		animationName: { default: null, [media.motionSafe]: pulse },
		animationDuration: '2.4s',
		animationTimingFunction: ease['--ease-out'],
		animationIterationCount: 'infinite',
	},
})
