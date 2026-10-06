import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// A navigation entry: the site's menu row at the app's density. The page you are on sits flat
// in the petrol wash inside a petrol hairline, its icon in petrol: a place on the map, never a
// coloured side stripe (apps/landing/DESIGN.md, Menus).
export const navEntry = stylex.create({
	link: {
		position: 'relative',
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		height: '32px',
		paddingInline: '11px',
		fontSize: '13px',
		lineHeight: 1,
		color: color['--ink'],
		textDecoration: 'none',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
		transition: `background-color ${transition.fast}, border-color ${transition.fast}`,
	},
	current: {
		backgroundColor: {
			default: color['--wash'],
			':hover': color['--wash'],
		},
		borderColor: color['--accent-line'],
	},
	icon: { color: color['--muted'] },
	iconCurrent: { color: color['--accent'] },
	count: {
		marginLeft: 'auto',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	// The desks waiting on the reviewer: the one count in petrol.
	countYours: {
		paddingBlock: '1px',
		paddingInline: '5px',
		color: color['--accent'],
		backgroundColor: color['--white'],
		boxShadow: `inset 0 0 0 1px ${color['--accent-line']}`,
	},
	// Folded, the waiting count rides the icon's corner as a petrol square.
	badge: {
		position: 'absolute',
		top: '3px',
		left: '23px',
		minWidth: '14px',
		height: '14px',
		paddingInline: '3px',
		boxSizing: 'border-box',
		fontFamily: font['--mono'],
		fontSize: '9.5px',
		lineHeight: '14px',
		textAlign: 'center',
		color: color['--white'],
		backgroundColor: color['--accent'],
		opacity: 1,
		transition: 'opacity 120ms',
		transitionDelay: '80ms',
	},
	// Open, the badge waits unseen while the count beside the label shows: the two cross-fade
	// with the labels as the sidebar folds, on the labels' clock (hub-sidebar.styles.ts).
	badgeHidden: { opacity: 0, transitionDelay: '0ms' },
})
