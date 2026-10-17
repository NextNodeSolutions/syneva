import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The raised field: the drawing in one SVG on the paper, the names over it in HTML at the points the camera puts them, so they stay crisp and focusable at any angle. A part's name floats above its block; a platform's hangs under its nearest corner like a plaque.

export const projection = stylex.create({
	field: {
		position: 'relative',
		overflow: 'hidden',
		backgroundColor: color['--paper'],
		userSelect: 'none',
	},
	drawing: {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
		overflow: 'visible',
	},
	names: {
		position: 'absolute',
		inset: 0,
		pointerEvents: 'none',
	},
	name: {
		position: 'absolute',
		top: 0,
		left: 0,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '5px',
		maxWidth: '240px',
		paddingBlock: '2px',
		paddingInline: '6px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		fontFamily: font['--sans'],
		fontSize: deskText.small,
		lineHeight: '16px',
		color: color['--ink'],
		whiteSpace: 'nowrap',
		pointerEvents: 'auto',
		cursor: 'pointer',
	},
	plaque: {
		backgroundColor: color['--iso-platform'],
		borderStyle: 'dashed',
		fontFamily: font['--mono'],
		fontSize: '10px',
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	nameText: { overflow: 'hidden', textOverflow: 'ellipsis' },
	// A name keeps its badges on its one line.
	nameBadges: { flexWrap: 'nowrap', flexShrink: 0, marginTop: 0 },
	struck: { textDecoration: 'line-through' },
	nameLit: { borderColor: color['--accent'] },
	nameSelected: {
		backgroundColor: color['--wash'],
		borderColor: color['--accent'],
	},
	nameDim: { opacity: 0.35 },
	// A part's name sits above the point, centred on it; a plaque hangs under its point.
	above: (x: number, y: number) => ({
		transform: `translate(${x}px, ${y}px) translate(-50%, -100%)`,
	}),
	under: (x: number, y: number) => ({
		transform: `translate(${x}px, ${y}px) translate(-50%, 4px)`,
	}),
	stack: (rank: number) => ({ zIndex: rank }),
	centred: (x: number, y: number) => ({
		transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
	}),
	words: {
		position: 'absolute',
		top: 0,
		left: 0,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '4px',
		maxWidth: '180px',
		paddingInline: '4px',
		backgroundColor: color['--paper'],
		fontFamily: font['--sans'],
		fontSize: '10.5px',
		lineHeight: '16px',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
})
