import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// An element is a white tile under one rule, like every card on the desk; a part the change touches takes its change's colour on that rule and a heavier left edge, the one strong colour on the map. Pointed at, a tile takes the palest petrol; selected, the wash and a 2px petrol frame drawn over its rule, so a tile never wears two borders.
export const node = stylex.create({
	tile: {
		display: 'flex',
		flexDirection: 'column',
		gap: '3px',
		width: '100%',
		height: '100%',
		paddingBlock: '9px',
		paddingInline: '10px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		color: color['--ink'],
		fontFamily: font['--sans'],
	},
	// A container is a dashed field over the canvas grid: its body stays clear so the links inside it read at full strength, its head is a solid band the links that cross into it pass behind.
	container: {
		display: 'flex',
		flexDirection: 'column',
		width: '100%',
		height: '100%',
		borderWidth: '1px',
		borderStyle: 'dashed',
		borderColor: color['--line-strong'],
		color: color['--muted'],
		fontFamily: font['--sans'],
	},
	containerHead: {
		display: 'flex',
		flexDirection: 'column',
		gap: '2px',
		paddingTop: '6px',
		paddingBottom: '6px',
		paddingInline: '10px',
		backgroundColor: color['--white'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	containerHeadLit: { backgroundColor: color['--wash-tint'] },
	containerHeadSelected: { backgroundColor: color['--wash'] },
	head: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '6px',
		minWidth: 0,
	},
	glyph: {
		flexShrink: 0,
		marginTop: '2px',
		color: color['--muted'],
	},
	// Two lines at most; a longer name ends in an ellipsis on the tile and reads whole in its title and the inspector.
	label: {
		display: '-webkit-box',
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: 2,
		overflow: 'hidden',
		fontSize: '12.5px',
		fontWeight: 500,
		lineHeight: '17px',
		overflowWrap: 'anywhere',
	},
	containerName: {
		flexGrow: 1,
		lineHeight: '17px',
		minWidth: 0,
		overflow: 'hidden',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		fontWeight: 500,
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
		color: color['--ink'],
	},
	// The kind and the technology wrap rather than cut: the tile is sized for two lines.
	caption: {
		fontFamily: font['--mono'],
		fontSize: '10px',
		lineHeight: '15px',
		color: color['--muted'],
		overflowWrap: 'anywhere',
	},
	containerCaption: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		fontFamily: font['--mono'],
		fontSize: '10px',
		lineHeight: '16px',
		color: color['--muted'],
	},
	footer: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		marginTop: 'auto',
	},
	tag: { flexShrink: 0, paddingBlock: 0 },
	numbersEnd: { marginLeft: 'auto' },
	struck: { textDecoration: 'line-through' },
	lit: { backgroundColor: color['--wash-tint'] },
	dim: { opacity: 0.3 },
	selected: {
		backgroundColor: color['--wash'],
		outlineWidth: '2px',
		outlineStyle: 'solid',
		outlineColor: color['--accent'],
		outlineOffset: '-1px',
	},
	containerSelected: {
		outlineWidth: '2px',
		outlineStyle: 'solid',
		outlineColor: color['--accent'],
		outlineOffset: '-1px',
	},
	small: { fontSize: deskText.small },
})

// The tile's rule says what the change does to the element: added green, changed petrol, removed red and dashed; the left edge carries it at 3px so it reads from across the map.
export const tileChange = stylex.create({
	added: { borderColor: color['--green'], borderLeftWidth: '3px' },
	changed: { borderColor: color['--accent'], borderLeftWidth: '3px' },
	removed: {
		borderColor: color['--red'],
		borderStyle: 'dashed',
		borderLeftWidth: '3px',
	},
})
