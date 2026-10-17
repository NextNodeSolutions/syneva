import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const api = stylex.create({
	list: { display: 'flex', flexDirection: 'column' },
	endpoint: {
		paddingBlock: '8px',
		paddingInline: '12px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	head: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '6px',
	},
	method: {
		minWidth: '52px',
		paddingBlock: '1px',
		paddingInline: '5px',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		fontWeight: 600,
		letterSpacing: '.06em',
		textAlign: 'center',
		color: color['--white'],
		backgroundColor: color['--ink'],
	},
	path: {
		minWidth: 0,
		overflowWrap: 'anywhere',
		fontFamily: font['--mono'],
		fontSize: deskText.body,
		color: color['--ink'],
	},
	removedText: { textDecoration: 'line-through' },
	summary: {
		marginTop: '4px',
		marginBottom: 0,
		fontSize: deskText.body,
		lineHeight: 1.5,
		color: color['--muted'],
	},
	messages: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
		gap: '8px',
		marginTop: '6px',
	},
	messageLabel: {
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	fields: { margin: 0, padding: 0, listStyle: 'none' },
	field: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '6px',
		paddingBlock: '2px',
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		color: color['--ink'],
	},
	sign: { width: '10px', flexShrink: 0, fontWeight: 600 },
	signTone: { backgroundColor: 'transparent' },
	type: { marginLeft: 'auto', color: color['--muted'] },
	tag: {
		paddingBlock: '1px',
		paddingInline: '5px',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
	},
})
