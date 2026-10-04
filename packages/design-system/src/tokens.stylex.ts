import * as stylex from '@stylexjs/stylex'

// The variables keep literal custom-property names: the global stylesheet,
// SVG paints and the motion timelines read the same names StyleX writes, so
// one definition serves the three of them.

// Petrol blue (--accent) follows the work: trust and control, kin to the
// NextNode teal, and far enough from --green that the agent's work never
// reads as a verdict. Mint and green mark a human decision.
export const color = stylex.defineVars({
	'--paper': '#f6f6f0',
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
	'--green': '#35633f',
	'--line': '#dcdfd4',
	'--line-strong': '#a8afa1',
	'--grid': '#e4e7dc',
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
	'--ease-out': 'cubic-bezier(.2, 0, 0, 1)',
	'--ease-spring': 'cubic-bezier(.34, 1.36, .5, 1)',
})

// Transition times, named by speed because each serves both hover and state
// changes. Text, fills and nudges on links, buttons and menu rows answer
// fast; bordered fields, index rows, pagers and turning chevrons take the
// medium time.
export const duration = stylex.defineVars({
	'--duration-fast': '150ms',
	'--duration-medium': '200ms',
})

// The frame gutter narrows on tablets and phones; the ranges are exclusive
// so the variable never depends on rule order.
export const layout = stylex.defineVars({
	'--gutter': {
		default: '48px',
		'@media (min-width: 601px) and (max-width: 900px)': '30px',
		'@media (max-width: 600px)': '20px',
	},
})
