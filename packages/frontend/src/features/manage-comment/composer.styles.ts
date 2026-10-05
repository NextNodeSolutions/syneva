import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The inline composers. A new comment or a reply is a card of the thread's own
// family (square, ruled, the reviewer's strong left rule turning petrol while
// it holds the focus), so replying reads as adding the next message rather than
// summoning a dialog. An edit swaps the message's body for a white field inside
// the message card itself.
export const composer = stylex.create({
	card: {
		maxWidth: '76ch',
		marginBottom: { default: '10px', ':last-child': 0 },
		padding: '10px 14px 11px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line'],
			':focus-within': color['--line-strong'],
		},
		borderLeftWidth: '2px',
		borderLeftColor: {
			default: color['--line-strong'],
			':focus-within': color['--accent'],
		},
	},
	// The card shows the focus, so the text area draws none of its own.
	input: {
		display: 'block',
		width: '100%',
		minHeight: '54px',
		padding: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: 0,
		outline: 'none',
		backgroundColor: 'transparent',
		fontFamily: font['--sans'],
		fontSize: deskText.title,
		lineHeight: 1.6,
		color: color['--ink'],
		caretColor: color['--accent'],
		resize: 'vertical',
		'::placeholder': { color: color['--muted'] },
	},
	edit: {
		display: 'block',
		width: '100%',
		minHeight: '44px',
		marginTop: '2px',
		paddingBlock: '7px',
		paddingInline: '9px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line'],
			':focus': color['--accent'],
		},
		borderRadius: 0,
		outline: 'none',
		backgroundColor: color['--white'],
		fontFamily: font['--sans'],
		fontSize: deskText.title,
		lineHeight: 1.6,
		color: color['--ink'],
		caretColor: color['--accent'],
		resize: 'vertical',
	},
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		marginTop: '8px',
		paddingTop: '8px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	// Inside a message the row needs no rule of its own: the field closes it.
	editRow: {
		paddingTop: '6px',
		borderTopWidth: 0,
	},
	spacer: { flex: '1' },
})
