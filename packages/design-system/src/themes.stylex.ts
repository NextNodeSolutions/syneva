import * as stylex from '@stylexjs/stylex'

import { color } from './tokens.stylex'

// Night mirror for the apps' Appearance setting (the site stays light); overrides every `color` key by role: --paper keeps the chrome ground, --white becomes the raised surface.
// Text on solid fills and lightened accents flips to dark ink; text tones keep WCAG AA; neutrals keep the warm green cast, not blue-black.
export const dark = stylex.createTheme(color, {
	'--paper': '#101210',
	'--white': '#171a17',
	'--ink': '#e4e6de',
	'--muted': '#9ca196',
	'--accent': '#62b2cd',
	// Hover steps LIGHTER on a dark ground, where the light theme steps deeper.
	'--accent-deep': '#86c5da',
	'--accent-line': '#2c5d6c',
	'--signal': '#4cb2db',
	'--wash': '#132830',
	'--wash-tint': '#0f1d22',
	'--wash-ink': '#a9d0dd',
	'--mint': '#16271a',
	'--mint-tint': '#132017',
	'--mint-pale': '#111a13',
	'--green': '#80c48c',
	'--green-line': '#2f4d35',
	'--amber': '#d9a650',
	'--amber-tint': '#2b2213',
	'--amber-line': '#5c4621',
	'--red': '#e9827a',
	'--red-deep': '#f1a29b',
	'--red-tint': '#2d1816',
	'--red-line': '#60302b',
	'--red-pale': '#1f1413',
	'--line': '#272b27',
	'--line-strong': '#3c423c',
	'--grid': '#1b1f1b',
	'--wordmark': '#1e221e',
	'--field': '#1d211d',
	'--field-green': '#18211a',
	'--iso-platform': '#1a1d1a',
	'--iso-side': '#151815',
	'--iso-wash-side': '#1c3139',
	'--iso-mint-side': '#1d2c20',
})
