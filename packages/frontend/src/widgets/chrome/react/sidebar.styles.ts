import { deskSize, deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

const fast = `${duration['--duration-fast']} ${ease['--ease-out']}`
// The bleed that carries a strip across the sidebar's own padding.
const PAD = '8px'

// The sidebar: the Tree / Walkthrough tabs (guided desks), the file tree or
// the walkthrough, and Settings docked at the foot - on the paper chrome. On
// tablets it leaves the flow as a drawer over the diff.
export const sidebar = stylex.create({
	aside: {
		minWidth: 0,
		minHeight: 0,
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		paddingTop: PAD,
		paddingInline: PAD,
		backgroundColor: color['--paper'],
		position: { default: null, [media.tablet]: 'fixed' },
		top: { default: null, [media.tablet]: deskSize.topbar },
		left: { default: null, [media.tablet]: 0 },
		bottom: { default: null, [media.tablet]: 0 },
		width: { default: null, [media.tablet]: 'min(86vw, 300px)' },
		zIndex: { default: null, [media.tablet]: 30 },
		borderRightWidth: { default: 0, [media.tablet]: '1px' },
		borderRightStyle: 'solid',
		borderRightColor: color['--line-strong'],
		transform: { default: null, [media.tablet]: 'translateX(-100%)' },
		transition: `transform .18s ${ease['--ease-out']}`,
	},
	drawerOpen: {
		transform: { default: null, [media.tablet]: 'translateX(0)' },
	},
	hidden: { display: 'none' },
	// The tab strip shares the guide bar's height, so the two bottom rules
	// read as one line across the column seam.
	tabs: {
		flexShrink: 0,
		height: deskSize.subbar,
		marginTop: `-${PAD}`,
		marginInline: `-${PAD}`,
		marginBottom: PAD,
		paddingInline: '6px',
	},
	// The FILES caption and its expand / collapse-all toggle.
	head: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: '6px',
		paddingLeft: '8px',
		paddingRight: '2px',
	},
	pane: {
		flex: '1 1 auto',
		minHeight: 0,
		overflow: 'auto',
		marginInline: `-${PAD}`,
		paddingInline: PAD,
		paddingBottom: PAD,
	},
	// Settings, docked across the sidebar's foot under its own rule.
	settings: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		marginInline: `-${PAD}`,
		paddingBlock: '10px',
		paddingInline: '16px',
		borderWidth: 0,
		borderStyle: 'solid',
		borderTopWidth: '1px',
		borderTopColor: color['--line'],
		backgroundColor: {
			default: 'transparent',
			':hover': color['--field'],
		},
		color: { default: color['--muted'], ':hover': color['--ink'] },
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		textAlign: 'left',
		cursor: 'pointer',
		transition: `color ${fast}, background-color ${fast}`,
	},
	settingsKey: { marginLeft: 'auto' },
})

// One row of the tree or the walkthrough. Indentation steps by depth and the
// nesting rails (1px, every step) are drawn in the indent as a background, so
// any depth renders without per-level classes.
export const row = stylex.create({
	base: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		minHeight: '26px',
		paddingBlock: '3px',
		paddingRight: '8px',
		paddingLeft: '8px',
		backgroundImage: `repeating-linear-gradient(to right, transparent 0 13px, ${color['--line']} 13px 14px)`,
		backgroundRepeat: 'no-repeat',
		backgroundPosition: '1px 0',
		backgroundSize: '0 100%',
		backgroundColor: {
			default: 'transparent',
			':hover': color['--field'],
		},
		color: { default: color['--muted'], ':hover': color['--ink'] },
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		lineHeight: 1.5,
		whiteSpace: 'nowrap',
		cursor: 'pointer',
		userSelect: 'none',
		outlineOffset: '-2px',
	},
	// The indent and its rails for a depth (deskSize.indent per level).
	indent: (paddingLeft: string, rails: string) => ({
		paddingLeft,
		backgroundSize: rails,
	}),
	changed: { color: color['--ink'] },
	// The file on screen: the petrol wash under a petrol rail.
	active: {
		color: { default: color['--ink'], ':hover': color['--ink'] },
		backgroundColor: {
			default: color['--wash'],
			':hover': color['--wash'],
		},
		'::before': {
			content: '""',
			position: 'absolute',
			insetBlock: 0,
			left: 0,
			width: '2px',
			backgroundColor: color['--accent'],
		},
	},
	// A test file folded under its source file reads a step quieter.
	test: { color: color['--muted'] },
	name: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	// A walkthrough category: the caption voice, a jump target.
	category: {
		marginTop: { default: '10px', ':first-child': 0 },
		fontSize: deskText.label,
		fontWeight: 500,
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: { default: color['--muted'], ':hover': color['--ink'] },
	},
	// The trailing fold groups (Renamed, Reviewed): quiet, their count right.
	fold: { color: color['--muted'] },
	trail: {
		marginLeft: 'auto',
		display: 'inline-flex',
		alignItems: 'center',
		gap: deskSize.churnGap,
		flexShrink: 0,
	},
	count: {
		marginLeft: 'auto',
		fontSize: deskText.label,
		letterSpacing: 0,
		textTransform: 'none',
		color: color['--muted'],
	},
	// "← old/path" on a pure rename.
	movedFrom: {
		marginLeft: '6px',
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		fontSize: deskText.label,
		color: color['--muted'],
	},
	added: {
		fontSize: deskText.label,
		fontStyle: 'normal',
		color: color['--green'],
	},
	removed: {
		fontSize: deskText.label,
		fontStyle: 'normal',
		color: color['--red'],
	},
})

// The row's glyphs: the fold chevron, the folder and the file (tinted by its
// change: green added, petrol modified, red deleted), and the review state.
export const glyph = stylex.create({
	chevron: {
		width: '12px',
		color: color['--muted'],
		transition: `transform ${fast}`,
	},
	chevronOpen: { transform: 'rotate(90deg)' },
	spacer: { width: '12px', flexShrink: 0 },
	folder: { color: color['--muted'] },
	file: { color: color['--line-strong'] },
	new: { color: color['--green'] },
	modified: { color: color['--accent'] },
	deleted: { color: color['--red'] },
	badge: { width: '13px', height: '13px' },
	pending: { color: color['--accent'] },
	approved: { color: color['--green'] },
	changes: { color: color['--amber'] },
	// A walkthrough's to-do circle stays quiet until the file is decided.
	todo: { color: color['--line-strong'] },
	testCaret: { display: 'inline-flex', cursor: 'pointer' },
})
