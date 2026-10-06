import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const diffHeader = stylex.create({
	header: {
		display: 'flex',
		flexDirection: 'column',
		gap: '6px',
		width: '100%',
		paddingBlock: '8px',
		paddingInline: '16px',
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontFamily: font['--sans'],
		fontSize: deskText.body,
	},
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	icon: {
		flexShrink: 0,
		width: '15px',
		height: '15px',
		fill: 'currentColor',
	},
	path: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.title,
		fontWeight: 600,
		color: color['--ink'],
	},
	moved: {
		flexShrink: 1,
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--amber'],
	},
	editorIcon: { width: '13px', height: '13px' },
	grow: { flexGrow: 1 },
	readonly: { flexShrink: 0 },
	counts: { fontSize: deskText.body },
	actions: {
		flexShrink: 0,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
	},
	undo: {
		color: color['--amber'],
		backgroundColor: {
			default: 'transparent',
			':hover': color['--amber-tint'],
		},
		borderColor: {
			default: color['--amber-line'],
			':hover': color['--amber'],
		},
	},
	guide: {
		alignSelf: 'flex-start',
		display: 'flex',
		alignItems: 'center',
		marginLeft: '6px',
		marginBottom: '1px',
		paddingBlock: '1px',
		paddingLeft: '10px',
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--accent'],
	},
	category: {
		fontSize: deskText.label,
		color: color['--accent'],
		whiteSpace: 'nowrap',
	},
})
