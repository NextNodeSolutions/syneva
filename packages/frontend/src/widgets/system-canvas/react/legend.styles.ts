import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The legend is one quiet line on white under the toolbar: the projection's name in ink, its purpose in muted text, the keys at the end.
export const legend = stylex.create({
	line: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		columnGap: '10px',
		rowGap: '4px',
		margin: 0,
		paddingBlock: '6px',
		paddingInline: '10px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: deskText.small,
		lineHeight: 1.4,
		color: color['--muted'],
	},
	name: {
		fontWeight: 600,
		color: color['--ink'],
	},
	text: { flexGrow: 1, flexBasis: '320px' },
	keys: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		fontFamily: font['--mono'],
		fontSize: '10px',
	},
	key: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '4px',
	},
	swatch: {
		width: '10px',
		height: '10px',
		borderWidth: '1px',
		borderStyle: 'solid',
	},
	added: { backgroundColor: color['--mint'], borderColor: color['--green'] },
	changed: {
		backgroundColor: color['--wash'],
		borderColor: color['--accent'],
	},
	removed: {
		backgroundColor: color['--red-tint'],
		borderColor: color['--red'],
		borderStyle: 'dashed',
	},
	number: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: '14px',
		height: '14px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--white'],
		color: color['--ink'],
	},
})
