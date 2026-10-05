import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// The header's clock, shared by the styles and the navigation runtime
// (nav-clock.ts parses it once): the morph's durations as CSS times, its ease
// and its travels in px, and the phone link bar's entrance.
export const navClock = stylex.defineConsts({
	menuDuration: '240ms',
	previewDuration: '150ms',
	closeDuration: '160ms',
	barDuration: '280ms',
	ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
	panelTravel: '16',
	previewTravel: '24',
})

// The dropdown's frame, which the runtime's geometry reads from the computed
// style because it changes with the width: the space it keeps from the
// header's edges (on phones the link bar's inset, so the dropdown lines up
// under the bar) and its border.
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
