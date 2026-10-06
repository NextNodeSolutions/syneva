import * as stylex from '@stylexjs/stylex'

import { curves } from './curves.stylex'
import { media } from './media.stylex'

// Literal custom-property names: the global stylesheet, SVG paints and motion timelines read the same names StyleX writes.

// The colours some places need as a hex, not a variable: the document's theme-color meta tints the browser chrome, and an email client resolves no custom property. `color` below takes them from here, so each value has one home.
export const hexColor = stylex.defineConsts({
	paper: '#f6f6f0',
	white: '#ffffff',
	ink: '#191b18',
	muted: '#60635c',
	accent: '#0e6582',
	accentLine: '#8eb5bf',
	wash: '#dcedf4',
	washTint: '#eff7fa',
	washInk: '#2f5566',
	mint: '#e0eddf',
	mintTint: '#eef5ec',
	green: '#35633f',
	greenLine: '#a9c6a5',
	line: '#dcdfd4',
	lineStrong: '#a8afa1',
	field: '#eef0e7',
})

export const color = stylex.defineVars({
	'--paper': hexColor.paper,
	'--white': hexColor.white,
	'--ink': hexColor.ink,
	'--muted': hexColor.muted,
	'--accent': hexColor.accent,
	'--accent-deep': '#0b506a',
	'--accent-line': hexColor.accentLine,
	'--signal': '#1888b0',
	'--wash': hexColor.wash,
	'--wash-tint': hexColor.washTint,
	'--wash-ink': hexColor.washInk,
	'--mint': hexColor.mint,
	'--mint-tint': hexColor.mintTint,
	'--mint-pale': '#f2f7f0',
	'--green': hexColor.green,
	'--green-line': hexColor.greenLine,
	// Semantic colours: petrol = the agent's work, mint/green = a human decision, amber = a change the reviewer asked for, red = removed/destructive/error; neither decorates.
	'--amber': '#875a0e',
	'--amber-tint': '#f6ecd6',
	'--amber-line': '#d8bd86',
	'--red': '#a8322d',
	'--red-deep': '#8a2722',
	'--red-tint': '#f8e7e3',
	'--red-line': '#e2aea6',
	'--red-pale': '#fbefec',
	'--line': hexColor.line,
	'--line-strong': hexColor.lineStrong,
	'--grid': '#e4e7dc',
	'--wordmark': '#dfe3d6',
	'--field': hexColor.field,
	'--field-green': '#edf2e9',
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

// Named by speed: text, fills and nudges answer fast; bordered fields, index rows, pagers and chevrons take the medium time.
export const duration = stylex.defineVars({
	'--duration-fast': '150ms',
	'--duration-medium': '200ms',
	// Icon springs overshoot, so they run twice the fill time beside them (icon with its fill).
	'--duration-spring-fast': '300ms',
	'--duration-spring-medium': '400ms',
	'--duration-shift': '300ms',
	'--duration-step': '250ms',
})

// Gutter narrows on tablets/phones; StyleX writes width queries widest first, so the phone value wins where both match.
export const layout = stylex.defineVars({
	'--gutter': {
		default: '48px',
		[media.narrow]: '30px',
		[media.phone]: '20px',
	},
})

// Every section heading shares it (a component's own heading style wins over it), so no section outranks another.
export const typeScale = stylex.defineVars({
	'--h2-size': 'clamp(32px, 3.7vw, 46px)',
})
