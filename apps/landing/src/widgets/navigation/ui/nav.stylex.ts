import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// The header's clock. The navigation runtime reads the morph's timings from
// the computed style (durations as CSS times, travel in px) so the
// stylesheet stays the one source; the phone link bar enters on it too.
export const navClock = stylex.defineVars({
	'--nav-menu-duration': '240ms',
	'--nav-preview-duration': '150ms',
	'--nav-close-duration': '160ms',
	'--nav-bar-duration': '280ms',
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

// The dropdown's bounds, measured and written by the runtime in px
// (navigation-morph.ts): the width a panel may take and the heights the
// viewport leaves. Until the first measure they hold initial, the
// guaranteed-invalid value, so a property reading one keeps its own initial
// value.
export const navBounds = stylex.defineVars({
	'--nav-available': 'initial',
	'--dropdown-max-height': 'initial',
	'--panel-max-height': 'initial',
})
