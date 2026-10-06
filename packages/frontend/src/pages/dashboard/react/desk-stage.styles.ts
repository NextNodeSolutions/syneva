import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The stage cell: a square and a mono label on one line (with the age of the agent's last
// line beside it), then the detail under it on one line, indented to the label and cut with an
// ellipsis (the agent's whole line is in the row's description and on the desk). Beside the desk title (at full width and on tablets), the line sits 2px lower so the
// mono label shares the title's baseline.
export const deskStage = stylex.create({
	cell: { gridArea: 'stage', minWidth: 0 },
	line: {
		display: 'flex',
		alignItems: 'center',
		gap: '9px',
		minWidth: 0,
		minHeight: '22px',
		// The label and the age are never cut: a line too narrow for both wraps the age under
		// the label (the detail line below is the one that takes an ellipsis).
		flexWrap: 'wrap',
		rowGap: 0,
		whiteSpace: 'nowrap',
		marginTop: { default: '2px', [media.stacked]: 0 },
	},
	label: {
		fontFamily: font['--mono'],
		fontSize: '12px',
		letterSpacing: '.01em',
		lineHeight: '22px',
	},
	// Your turn on its index badge (merged after the tag recipe): the column's own size, so
	// only the ground marks the turn, never a smaller label.
	badge: { fontSize: '12px', letterSpacing: '.01em' },
	ink: { color: color['--ink'] },
	accent: { color: color['--accent'] },
	muted: { color: color['--muted'] },
	ago: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	detail: {
		marginTop: '1px',
		paddingLeft: '16px',
		fontSize: '12.5px',
		lineHeight: 1.45,
		color: color['--muted'],
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	words: { color: color['--ink'] },
})
