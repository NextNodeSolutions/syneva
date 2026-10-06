import * as stylex from '@stylexjs/stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

import { shell } from './shell.stylex'

// The sidebar: the chrome's paper ground under a right rule, its entries at the app's density.
// It folds to the rail by narrowing, never by re-laying itself out: every icon sits on the
// rail's centre line in both states (the list's 8px inset plus the entry's 12px padding put a
// 16px icon's centre 28px in, half the rail), so folding only clips the labels away.
const LABEL_FADE = `120ms ${ease['--ease-out']}`

export const sidebar = stylex.create({
	// The sidebar carries its own type and ink, so it reads the same on the dashboard and over
	// the desk, whatever the page around it sets.
	root: {
		boxSizing: 'border-box',
		fontFamily: font['--sans'],
		fontSize: '13px',
		lineHeight: 1.5,
		color: color['--ink'],
		WebkitFontSmoothing: 'antialiased',
		display: 'flex',
		flexDirection: 'column',
		width: '100%',
		height: '100%',
		minWidth: 0,
		overflowX: 'hidden',
		overflowY: 'auto',
		backgroundColor: color['--paper'],
		borderRightWidth: '1px',
		borderRightStyle: 'solid',
		borderRightColor: color['--line'],
		scrollbarWidth: 'thin',
	},
	top: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0,
		height: shell.barHeight,
		paddingInline: '18px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	// Anything that is a word, not an icon: it fades out ahead of the fold and back in after
	// the unfold, so a half-clipped label never shows.
	label: {
		whiteSpace: 'nowrap',
		opacity: 1,
		transition: `opacity ${LABEL_FADE}`,
		transitionDelay: '80ms',
	},
	labelFolded: {
		opacity: 0,
		transitionDelay: '0ms',
	},
	section: {
		margin: 0,
		listStyle: 'none',
		display: 'flex',
		flexDirection: 'column',
		gap: '1px',
		paddingInline: '8px',
		paddingBlock: '10px',
	},
	group: {
		margin: 0,
		boxSizing: 'border-box',
		height: '28px',
		paddingInline: '12px',
		paddingTop: '10px',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	foot: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		marginTop: 'auto',
		flexShrink: 0,
		minHeight: '48px',
		paddingLeft: '24px',
		paddingRight: '8px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	status: {
		margin: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		minWidth: 0,
		flex: '1',
	},
	foldButton: {
		flexShrink: 0,
		marginLeft: 'auto',
	},
	// Folded, the foot keeps only the fold control, on the rail's centre line.
	footFolded: {
		paddingLeft: 0,
		paddingRight: 0,
		justifyContent: 'center',
	},
	statusFolded: { display: 'none' },
	foldButtonFolded: { marginLeft: 0 },
})
