import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// An element is a white tile ruled like every card on the desk; what the change does to it is its rule's colour and a worded tag, never the hue alone.
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
	// Lit or selected, a container keeps its body clear and takes only the hairline (its head takes the wash).
	containerLit: {
		outlineWidth: '1px',
		outlineStyle: 'solid',
		outlineColor: color['--accent'],
		outlineOffset: '2px',
	},
	containerSelected: {
		outlineWidth: '2px',
		outlineStyle: 'solid',
		outlineColor: color['--accent'],
		outlineOffset: '2px',
	},
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
		lineHeight: '16px',
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
	caption: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		minWidth: 0,
		fontFamily: font['--mono'],
		fontSize: '10px',
		lineHeight: '16px',
		color: color['--muted'],
	},
	captionText: {
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
	},
	tag: { marginLeft: 'auto', flexShrink: 0, paddingBlock: 0 },
	struck: { textDecoration: 'line-through' },
	badges: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '3px',
		marginTop: 'auto',
	},
	// A container's badges close its name's row, its kind and change take the row under it, so the head holds in the narrow box its parts leave it.
	badgesInHead: { flexShrink: 0, marginTop: 0 },
	badge: {
		minWidth: '18px',
		paddingBlock: 0,
		paddingInline: '4px',
		justifyContent: 'center',
	},
	toRead: {
		borderBottomWidth: '2px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--red'],
	},
	// The domain the reviewer points at: its parts on the wash inside a petrol hairline, the rest stepped back.
	lit: {
		backgroundColor: color['--wash-tint'],
		outlineWidth: '1px',
		outlineStyle: 'solid',
		outlineColor: color['--accent'],
		outlineOffset: '2px',
	},
	dim: { opacity: 0.32 },
	selected: {
		backgroundColor: color['--wash'],
		outlineWidth: '2px',
		outlineStyle: 'solid',
		outlineColor: color['--accent'],
		outlineOffset: '2px',
	},
	small: { fontSize: deskText.small },
})

// The tile's rule says what the change does to the element: added green, changed petrol, removed red and dashed.
export const tileChange = stylex.create({
	added: { borderColor: color['--green'] },
	changed: { borderColor: color['--accent'] },
	removed: { borderColor: color['--red'], borderStyle: 'dashed' },
})
