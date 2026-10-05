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

// The dock's clock (dock.styles.ts): the header locks onto its floating sheet
// on a slow, settling move with a springy lock-on for the corners, and lets go
// of it faster than it took it. The phone bar folds back into its toggle on
// the close time (phone-bar.ts waits it out before hiding the bar).
export const dockClock = stylex.defineConsts({
	dockDuration: '520ms',
	undockDuration: '240ms',
	settleDelay: '380ms',
	ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
	lockEase: 'cubic-bezier(0.34, 1.45, 0.5, 1)',
	foldDuration: '160ms',
})

// The docked sheet, centred on the header's own centre line so nothing inside
// the header moves when it docks: its gap from the viewport's top (the same
// gap stays below it, inside the header's box), its height, and its inset
// from the frame's edges.
export const navDock = stylex.defineVars({
	'--dock-top': {
		default: '16px',
		[media.narrow]: '10px',
		[media.phone]: '6px',
	},
	'--dock-height': '56px',
	'--dock-inset': {
		default: '28px',
		[media.narrow]: '14px',
		[media.navToggle]: '8px',
		[media.tinyPhone]: '6px',
	},
	'--dock-radius': '8px',
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
