import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

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

// The dropdown's frame, read by the runtime's geometry like the clock: the
// space it keeps from the header's edges (on phones the link bar's inset, so
// the dropdown lines up under the bar) and its border.
export const navFrame = stylex.defineVars({
	'--nav-dropdown-inset': { default: '24px', [media.navToggle]: '12px' },
	'--nav-dropdown-border': '1px',
})
