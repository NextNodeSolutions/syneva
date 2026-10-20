import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A figure as the RFC pages draw one: the drawing on the gridded field between four corner
// marks, across the band's width (prose keeps its measure, a drawing needs the room), its
// number, title and detail as a mono caption under it, its sentences one step away.
const GRID = '26px'
const MARK = '12px'
const MARK_INSET = '14px'

export const planFigure = stylex.create({
	root: { marginTop: '26px' },
	field: {
		position: 'relative',
		overflowX: 'auto',
		paddingBlock: '30px',
		paddingInline: '26px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--field'],
		backgroundImage: `linear-gradient(${color['--grid']} 1px, transparent 1px), linear-gradient(90deg, ${color['--grid']} 1px, transparent 1px)`,
		backgroundSize: `${GRID} ${GRID}`,
	},
	mark: {
		position: 'absolute',
		width: MARK,
		height: MARK,
		borderColor: color['--line-strong'],
		borderStyle: 'solid',
		borderWidth: 0,
	},
	topLeft: {
		top: MARK_INSET,
		left: MARK_INSET,
		borderTopWidth: '1px',
		borderLeftWidth: '1px',
	},
	topRight: {
		top: MARK_INSET,
		right: MARK_INSET,
		borderTopWidth: '1px',
		borderRightWidth: '1px',
	},
	bottomLeft: {
		bottom: MARK_INSET,
		left: MARK_INSET,
		borderBottomWidth: '1px',
		borderLeftWidth: '1px',
	},
	bottomRight: {
		bottom: MARK_INSET,
		right: MARK_INSET,
		borderBottomWidth: '1px',
		borderRightWidth: '1px',
	},
	drawing: { position: 'relative' },
	caption: {
		marginTop: '14px',
		maxWidth: '86ch',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		lineHeight: 1.55,
		color: color['--muted'],
	},
	captionTitle: { color: color['--ink'], fontWeight: 500 },
	sentences: {
		marginTop: '8px',
		fontSize: '13px',
		color: color['--muted'],
	},
	summary: {
		cursor: 'pointer',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
	},
	sentenceList: {
		marginTop: '6px',
		paddingLeft: '18px',
		listStyleType: 'disc',
	},
	invalid: {
		marginTop: '26px',
		paddingBlock: '12px',
		paddingInline: '16px',
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--amber'],
		backgroundColor: color['--amber-tint'],
		fontSize: '13.5px',
	},
	source: {
		marginTop: '10px',
		overflowX: 'auto',
		paddingBlock: '10px',
		paddingInline: '14px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		backgroundColor: color['--white'],
		fontFamily: font['--mono'],
		fontSize: '12px',
		lineHeight: 1.5,
		whiteSpace: 'pre',
	},
})
