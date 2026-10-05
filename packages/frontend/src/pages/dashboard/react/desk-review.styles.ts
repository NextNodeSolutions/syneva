import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const mono = {
	fontFamily: font['--mono'],
	fontSize: '11.5px',
	color: color['--muted'],
} as const

// The review cell, in the mono annotation voice: the approvals meter and its count on one
// line, then the decided changes and what is still open (requests in amber, questions in
// petrol). While a close is armed, its warning takes the cell: a sentence, so in red prose
// at the stage note's size, its square on the first line.
export const deskReview = stylex.create({
	cell: { gridArea: 'review', minWidth: 0 },
	// Beside the desk title (full width only: from tablets down the review has a line of its
	// own), 2px lower, on the title's baseline.
	approvals: {
		...mono,
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		minHeight: '22px',
		marginTop: { default: '2px', [media.tablet]: 0 },
		whiteSpace: 'nowrap',
	},
	figure: { color: color['--ink'] },
	// Every file approved: a verdict, so green.
	done: { color: color['--green'] },
	progress: {
		...mono,
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		columnGap: '14px',
		rowGap: '4px',
		marginTop: '4px',
		lineHeight: 1.45,
	},
	item: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '7px',
		whiteSpace: 'nowrap',
	},
	requests: { color: color['--amber'] },
	questions: { color: color['--accent'] },
	warning: {
		display: 'flex',
		gap: '9px',
		marginTop: { default: '2px', [media.tablet]: 0 },
		fontSize: '13px',
		lineHeight: 1.45,
		color: color['--red'],
		textWrap: 'pretty',
	},
	warningDot: { marginTop: '6px' },
})
