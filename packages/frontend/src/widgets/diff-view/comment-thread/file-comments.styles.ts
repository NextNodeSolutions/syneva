import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The whole-file comments: one white card of the thread family under the file
// header (on the oversized card, atop the rendered markdown), its thread and
// composer separated by 1px rules - neutral, so it reads as conversation, not
// as a warning. The markdown view leads it with a trigger bar of its own.
export const fileComments = stylex.create({
	section: {
		marginTop: '5px',
		marginBottom: '2px',
		paddingTop: '2px',
		paddingBottom: '4px',
		fontFamily: font['--sans'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
	},
	// On the oversized card it stands apart from the note above it.
	onCard: { marginTop: '10px' },
	// Atop the rendered markdown it leads the document, clear of its first block.
	inDocument: { marginTop: 0, marginBottom: '20px' },
	// Every part after the first (bar, thread, composer) opens on a rule.
	rule: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	bar: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		padding: '6px 10px 4px',
	},
	label: {
		fontSize: deskText.small,
		color: color['--muted'],
	},
	// The trigger as a 24px tile (the oversized card's head, the markdown bar);
	// in the diff header it is the 22px quiet square of the header's icons.
	tile: {
		width: '24px',
		minHeight: '24px',
		paddingBlock: 0,
		paddingInline: 0,
	},
})
