import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease } from '@syneva/design-system/tokens.stylex'

import { shell } from './shell.stylex'

const FOLD = `220ms ${ease['--ease-out']}`
const DRAWER = `260ms ${ease['--ease-out']}`
const PHONE = media.stacked

// The application frame: the sidebar column and the page beside it, filling the viewport.
// Each scrolls on its own, so the sidebar never leaves while a long page moves. The column
// narrows to the rail by its grid track, which eases: the page beside it widens in step. On
// phones the sidebar leaves the grid for a drawer under a bar of its own.
export const hubShell = stylex.create({
	frame: {
		display: 'grid',
		gridTemplateColumns: {
			default: `${shell.sidebarWidth} minmax(0, 1fr)`,
			[PHONE]: 'minmax(0, 1fr)',
		},
		gridTemplateRows: {
			default: '100dvh',
			[PHONE]: `${shell.barHeight} auto`,
		},
		minHeight: '100dvh',
		backgroundColor: color['--paper'],
		transition: `grid-template-columns ${FOLD}`,
	},
	frameFolded: {
		gridTemplateColumns: {
			default: `${shell.railWidth} minmax(0, 1fr)`,
			[PHONE]: 'minmax(0, 1fr)',
		},
	},
	sidebar: {
		minWidth: 0,
		height: '100dvh',
		position: { default: 'relative', [PHONE]: 'fixed' },
		zIndex: { default: 'auto', [PHONE]: 40 },
		top: 0,
		left: 0,
		width: { default: 'auto', [PHONE]: 'min(300px, 86vw)' },
		transform: { default: 'none', [PHONE]: 'translateX(-100%)' },
		transition: `transform ${DRAWER}, box-shadow ${DRAWER}`,
	},
	sidebarOpen: {
		transform: 'none',
		boxShadow: {
			default: 'none',
			[PHONE]: '0 12px 32px rgb(25 27 24 / 14%)',
		},
	},
	// The paper veil behind the open drawer (a dialog's veil, never a dark scrim); a tap on it
	// closes the drawer.
	veil: {
		display: 'none',
	},
	veilOpen: {
		display: { default: 'none', [PHONE]: 'block' },
		position: 'fixed',
		inset: 0,
		zIndex: 39,
		backgroundColor: `color-mix(in srgb, ${color['--paper']} 74%, transparent)`,
	},
	main: {
		minWidth: 0,
		height: { default: '100dvh', [PHONE]: 'auto' },
		overflowY: { default: 'auto', [PHONE]: 'visible' },
		scrollbarGutter: 'stable',
		outlineStyle: 'none',
		// The page under the sidebar is what a view transition moves (the dashboard's shell
		// names the animation); the sidebar holds still.
		viewTransitionName: 'hub-page',
	},
	bar: {
		display: { default: 'none', [PHONE]: 'flex' },
		position: 'sticky',
		top: 0,
		zIndex: 30,
		alignItems: 'center',
		gap: '12px',
		height: shell.barHeight,
		paddingInline: '12px',
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	barEnd: { marginLeft: 'auto' },
})
