import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

import { shell } from './shell.stylex'

const PEEK = `240ms ${ease['--ease-out']}`
// Open, the clip reaches past the panel's edge so its shadow shows.
const OPEN_CLIP = 'inset(0 -48px 0 0)'

// The desk's rail: the hub's sidebar folded to its icons at the desk's left edge, the whole
// height of the page. Opened, the full sidebar uncovers over the desk (it floats, so it takes
// the system's one shadow) rather than pushing the review aside; the desk stays where it was.
// The panel always has the open sidebar's width and its clip is what moves, so opening it never
// lays the sidebar out again frame by frame. Phones keep the desk's own drawers and the brand
// in its bar: no rail there.
export const deskRail = stylex.create({
	rail: {
		position: 'relative',
		zIndex: 45,
		width: shell.railWidth,
		height: '100%',
		display: { default: 'block', [media.stacked]: 'none' },
	},
	panel: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		width: shell.sidebarWidth,
		// Folded, the clip hides everything past the rail's width.
		clipPath: `inset(0 calc(100% - ${shell.railWidth}) 0 0)`,
		transition: `clip-path ${PEEK}, box-shadow ${PEEK}`,
	},
	panelOpen: {
		clipPath: OPEN_CLIP,
		boxShadow: '0 12px 32px rgb(25 27 24 / 14%)',
	},
	waitingList: { margin: 0, padding: 0, listStyle: 'none' },
	waiting: {
		paddingInline: '8px',
		paddingBottom: '6px',
	},
	waitingLabel: {
		margin: 0,
		height: '28px',
		paddingInline: '12px',
		paddingTop: '10px',
		boxSizing: 'border-box',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	waitingLink: {
		display: 'grid',
		gridTemplateColumns: '7px minmax(0, 1fr)',
		alignItems: 'center',
		columnGap: '12px',
		minHeight: '32px',
		paddingLeft: '15px',
		paddingRight: '8px',
		color: color['--ink'],
		textDecoration: 'none',
		fontSize: '12.5px',
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
	},
	waitingName: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	waitingProject: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
	},
})
