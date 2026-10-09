import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const refChip = stylex.create({
	chip: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '5px',
		paddingBlock: '1px',
		paddingInline: '6px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--accent-line'],
		backgroundColor: {
			default: color['--white'],
			':hover': color['--wash'],
		},
		color: color['--accent'],
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		verticalAlign: '1px',
		cursor: 'pointer',
	},
	context: { borderStyle: 'dashed', color: color['--wash-ink'] },
	stale: { borderColor: color['--amber-line'], color: color['--amber'] },
	unresolved: {
		borderColor: color['--amber-line'],
		color: color['--amber'],
		textDecorationLine: 'line-through',
		textDecorationColor: color['--amber-line'],
		cursor: 'not-allowed',
		backgroundColor: {
			default: color['--white'],
			':hover': color['--white'],
		},
	},
	glyph: { fontSize: '9px' },
	state: {
		fontSize: '9.5px',
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		textDecorationLine: 'none',
	},
})
