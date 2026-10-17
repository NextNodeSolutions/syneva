import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The brick view's card, in the name bar's place: the brick's name in the size the file's name takes, its lines on each side and its tally in the labels' mono, so the bar keeps its height and rhythm when the code is cut to a brick.
export const brickCard = stylex.create({
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		minWidth: 0,
	},
	kind: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		color: color['--accent'],
	},
	name: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.title,
		fontWeight: 600,
		color: color['--ink'],
	},
	lines: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--ink'],
	},
	side: { color: color['--muted'] },
	// The file the brick sits in, the one label that gives way when the bar runs short.
	path: {
		flexShrink: 1,
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--muted'],
	},
	grow: { flexGrow: 1 },
	tally: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--muted'],
	},
	count: { color: color['--ink'] },
	whole: { flexShrink: 0 },
})
