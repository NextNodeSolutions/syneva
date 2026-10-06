import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// The header's clock, shared by the styles and the runtime (nav-clock.ts parses it once): durations as CSS times, the ease, the travels in px, and the phone link bar's entrance.
export const navClock = stylex.defineConsts({
	menuDuration: '240ms',
	previewDuration: '150ms',
	closeDuration: '160ms',
	barDuration: '280ms',
	ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
	panelTravel: '16',
	previewTravel: '24',
})

export const dockClock = stylex.defineConsts({
	dockDuration: '520ms',
	undockDuration: '240ms',
	settleDelay: '380ms',
	ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
	lockEase: 'cubic-bezier(0.34, 1.45, 0.5, 1)',
	foldDuration: '160ms',
})

export const phoneBar = stylex.defineConsts({ radius: '8px' })

// Centred on the header's own centre line so nothing inside the header moves when it docks.
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

// It changes with the width, so the runtime reads it from computed styles; on phones it is the link bar's inset, so the dropdown lines up under the bar.
export const navFrame = stylex.defineVars({
	'--nav-dropdown-inset': { default: '24px', [media.navToggle]: '12px' },
	'--nav-dropdown-border': '1px',
})

// Until the first measure they hold initial (the guaranteed-invalid value), so a property reading one keeps its own initial value.
export const navBounds = stylex.defineVars({
	'--nav-available': 'initial',
	'--dropdown-max-height': 'initial',
	'--panel-max-height': 'initial',
})
