import * as stylex from '@stylexjs/stylex'

import { controlMarker } from './controls.stylex'
import { media } from './media.stylex'
import { color, ease, font } from './tokens.stylex'
import { transition } from './transitions.stylex'

// The apps' controls (the hub dashboard, the desk), at application density:
// the site's square, ruled language - no radius, 1px borders, petrol for the
// action, Geist for the label and Geist Mono for anything typed or counted -
// sized for a working surface instead of a page. Compose a control as
// [press.control, control.base, control.<tone>, control.<size>?] and put the
// controlMarker on it when it carries an arrow.

const controlHover = (): string => stylex.when.ancestor(':hover', controlMarker)

// One focus ring for every control: petrol, outside the border.
const focusRing = {
	outlineWidth: { default: null, ':focus-visible': '2px' },
	outlineStyle: { default: null, ':focus-visible': 'solid' },
	outlineColor: { default: null, ':focus-visible': color['--accent'] },
	outlineOffset: '2px',
} as const

// The same ring for anything focusable that is not a control (a link, a radio,
// a skip link); `inset` draws it inside the box, for an element whose
// surroundings would clip it or that sits flush against its neighbours.
export const focus = stylex.create({
	ring: focusRing,
	inset: { ...focusRing, outlineOffset: '-2px' },
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
		// The width and padding hold the border: the shared sheet has no reset.
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
		// A disabled control keeps its place but takes no hover and no press.
		opacity: { default: null, ':disabled': 0.55 },
		pointerEvents: { default: null, ':disabled': 'none' },
		transition: `color ${transition.fast}, background-color ${transition.fast}, border-color ${transition.fast}, transform ${transition.fast}`,
	},
	// The action of a surface: solid petrol, white label.
	primary: {
		color: color['--white'],
		backgroundColor: hovered(color['--accent'], color['--accent-deep']),
		borderColor: hovered(color['--accent'], color['--accent-deep']),
	},
	// The site header's action: a white tile under a strong rule that turns
	// petrol on hover.
	outlined: {
		color: hovered(color['--ink'], color['--accent']),
		backgroundColor: hovered(color['--white'], color['--wash']),
		borderColor: hovered(color['--line-strong'], color['--accent']),
	},
	// A secondary action that should not compete: no tile until hovered.
	quiet: {
		color: hovered(color['--muted'], color['--ink']),
		backgroundColor: hovered('transparent', color['--field']),
		borderColor: 'transparent',
	},
	// A destructive action, shown only once it has been asked for (an armed
	// close, a discard): solid red.
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
	// An icon-only control: a square of the control's height.
	square: { paddingInline: 0, aspectRatio: '1' },
	// A control that fills its row (a form's single submit).
	block: { width: '100%' },
	// The arrow after a label, stepping forward while the control is hovered
	// (the control carries controlMarker).
	arrow: {
		display: 'inline-block',
		transition: `transform ${transition.fast}`,
		transform: { default: null, [controlHover()]: 'translateX(3px)' },
	},
})

// Text inputs, selects and text areas: white wells under a strong rule, the
// rule and a petrol halo marking focus.
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
	// Paths, refs, keys: anything typed that is not prose.
	mono: { fontFamily: font['--mono'], fontSize: '13px' },
	// The field a validation message points at.
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
	// A native select keeps its own menu and loses the platform arrow: the
	// select sits in selectBox beside a drawn chevron (an inline SVG stroked
	// with --muted, so a theme recolours it with the rest).
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

// Small mono text the chrome speaks in: captions over a field or a figure,
// counts, timestamps.
export const caption = stylex.create({
	base: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		fontWeight: 400,
		letterSpacing: '.02em',
		color: color['--muted'],
	},
	// The uppercase register, for a section's own label.
	upper: { textTransform: 'uppercase', letterSpacing: '.08em' },
})

// A tag names a state or a kind in mono on its tint (the site's index-row
// badge): petrol for the agent's work and the reviewer's questions, green for
// a verdict, amber for a requested change, red for what goes, neutral for a
// plain kind.
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

// The square that marks something live, set before its subject (the site's
// live dot). It pulses only while a live process holds it, and only when
// motion is welcome. A tone sets the colour and the square paints it as
// currentColor, so `hollow` outlines any tone instead of filling it.
export const dot = stylex.create({
	base: {
		display: 'inline-block',
		flexShrink: 0,
		width: '7px',
		height: '7px',
		color: color['--line-strong'],
		backgroundColor: 'currentColor',
	},
	// The live signal: a running process.
	accent: { color: color['--signal'] },
	// Petrol: the agent's work and the reviewer's questions.
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
