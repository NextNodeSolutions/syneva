import * as stylex from '@stylexjs/stylex'

import { curves } from './curves.stylex'
import { media } from './media.stylex'

// The variables keep literal custom-property names: the global stylesheet,
// SVG paints and the motion timelines read the same names StyleX writes, so
// one definition serves the three of them.

// The paper colour also tints the browser's own chrome through the
// document's theme-color meta, which needs the hex rather than a variable.
export const hexColor = stylex.defineConsts({ paper: '#f6f6f0' })

// Petrol blue (--accent) follows the work: trust and control, kin to the
// NextNode teal, and far enough from --green that the agent's work never
// reads as a verdict. Mint and green mark a human decision.
export const color = stylex.defineVars({
	'--paper': hexColor.paper,
	'--white': '#ffffff',
	'--ink': '#191b18',
	'--muted': '#60635c',
	'--accent': '#0e6582',
	'--accent-deep': '#0b506a',
	'--accent-line': '#8eb5bf',
	'--signal': '#1888b0',
	'--wash': '#dcedf4',
	'--wash-tint': '#eff7fa',
	'--wash-ink': '#2f5566',
	'--mint': '#e0eddf',
	// Added lines in a diff: the drawings' + lines sit on the tint, the hero's
	// added line sits on the pale mint until its accept turns it --mint.
	'--mint-tint': '#eef5ec',
	'--mint-pale': '#f2f7f0',
	'--green': '#35633f',
	// The rule tone of a green-marked surface, as --accent-line is petrol's.
	'--green-line': '#a9c6a5',
	// The apps' two other signals, each as text (AA on --paper, --white and
	// its own tint), tint fill and rule: amber marks a change the reviewer
	// asked for, red marks what goes (a removed line, a destructive action,
	// an error). Like petrol and green, neither decorates.
	'--amber': '#875a0e',
	'--amber-tint': '#f6ecd6',
	'--amber-line': '#d8bd86',
	'--red': '#a8322d',
	'--red-deep': '#8a2722',
	'--red-tint': '#f8e7e3',
	'--red-line': '#e2aea6',
	// A removed line's band: --mint-tint's counterpart.
	'--red-pale': '#fbefec',
	'--line': '#dcdfd4',
	'--line-strong': '#a8afa1',
	'--grid': '#e4e7dc',
	// The footer's frame-wide wordmark: pale enough to sit in the field
	// rather than read as text.
	'--wordmark': '#dfe3d6',
	'--field': '#eef0e7',
	'--field-green': '#edf2e9',
	// Thin sheet edges keep the drawings' depth inside the drawing.
	'--iso-platform': '#eef0e6',
	'--iso-side': '#e7ead9',
	'--iso-wash-side': '#c3dde9',
	'--iso-mint-side': '#d0dfcb',
})

export const font = stylex.defineVars({
	'--sans': 'Geist, system-ui, sans-serif',
	'--mono': "'Geist Mono', ui-monospace, monospace",
})

export const ease = stylex.defineVars({
	'--ease-out': curves.out,
	'--ease-spring': curves.spring,
})

// Transition times, named by speed because each serves both hover and state
// changes. Text, fills and nudges on links, buttons and menu rows answer
// fast; bordered fields, index rows, pagers and turning chevrons take the
// medium time.
export const duration = stylex.defineVars({
	'--duration-fast': '150ms',
	'--duration-medium': '200ms',
	// An icon's spring overshoots, so it runs twice the fill time beside it:
	// a menu row's icon with its fast fills, an index row's with its medium.
	'--duration-spring-fast': '300ms',
	'--duration-spring-medium': '400ms',
	// Hover motion that travels: an index row slides its content in, and its
	// arrow steps ahead.
	'--duration-shift': '300ms',
	'--duration-step': '250ms',
})

// The frame gutter narrows on tablets and phones. StyleX writes a variable's
// width queries widest first, so the phone value wins where both match.
export const layout = stylex.defineVars({
	'--gutter': {
		default: '48px',
		[media.narrow]: '30px',
		[media.phone]: '20px',
	},
})

// The size global.css gives every h2 (a component's own heading style wins
// over it): fluid down to its floor, then a step up on phones.
export const typeScale = stylex.defineVars({
	'--h2-size': {
		default: 'clamp(32px, 4.2vw, 52px)',
		[media.phone]: '33px',
	},
})
