import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The custom diff header Pierre slots above the rows (light DOM, so these
// classes reach it): the file's row - change icon, path, layout register,
// file actions, churn and the sign-off - on the paper chrome under one rule,
// and on a guided desk the section label under that row.
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
	// Pierre's change-type icon, drawn in the tone of the change.
	icon: {
		flexShrink: 0,
		width: '15px',
		height: '15px',
		fill: 'currentColor',
	},
	// The path leads the row and never shrinks; the rename note beside it
	// gives way first.
	path: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.title,
		fontWeight: 600,
		color: color['--ink'],
	},
	// "moved from <old>" beside a renamed file's new path (git -M).
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
	// The read-only tag of a preview (an unchanged file opened to read).
	readonly: { flexShrink: 0 },
	counts: { fontSize: deskText.body },
	actions: {
		flexShrink: 0,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
	},
	// Reset, the undo of a sign-off: amber, but only a rule until hovered - it
	// takes back a verdict, it is not one.
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
	// The guide's section for this file: a label on a petrol rule, the
	// thread cards' rail at row scale (a guide carries no prose, so there is
	// no card to draw). The margin sets the 2px rule under the centre of the
	// 15px change icon above it.
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
