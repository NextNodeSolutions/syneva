import * as stylex from '@stylexjs/stylex'

// The morph's clock, read by the navigation runtime from the computed style
// (durations as CSS times, travel in px) so the stylesheet stays the one
// source.
export const navClock = stylex.defineVars({
	'--nav-menu-duration': '240ms',
	'--nav-preview-duration': '150ms',
	'--nav-close-duration': '160ms',
	'--nav-ease': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
	'--nav-panel-travel': '16',
	'--nav-preview-travel': '24',
})
