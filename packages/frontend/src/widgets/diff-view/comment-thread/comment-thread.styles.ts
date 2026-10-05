import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { messageMarker } from './comment-thread.stylex'

const messageHover = (): string => stylex.when.ancestor(':hover', messageMarker)

// The box every thread and composer hangs in: the annotation Pierre slots under
// a line, a thread of the file-comment section or of the unanchored strip, a
// thread inside the rendered markdown. It draws on the diff's white canvas; the
// verdict bar pins itself to its top-right corner. A resolved thread dims as a
// whole, its verdict bar included.
export const annotation = stylex.create({
	slot: {
		position: 'relative',
		width: '100%',
		minHeight: '30px',
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		lineHeight: 1.5,
		color: color['--ink'],
	},
	resolved: { opacity: 0.62 },
	// A new comment's composer stands where a thread would, at a thread's inset.
	composer: { padding: '11px 16px 12px' },
})

// One thread read as a ruled ledger: each message a square card under a 2px
// left rule (the reviewer's strong rule, the agent's petrol on its wash, amber
// while it is being edited), then the thread's actions under a 1px rule.
export const thread = stylex.create({
	box: { padding: '11px 16px 12px' },
	boxResolved: { padding: '7px 12px' },
	message: {
		maxWidth: '76ch',
		marginBottom: { default: '10px', ':last-child': 0 },
		padding: '10px 14px 11px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		borderLeftWidth: '2px',
		borderLeftColor: color['--line-strong'],
	},
	messageAgent: {
		backgroundColor: color['--wash-tint'],
		borderColor: color['--accent-line'],
		borderLeftColor: color['--accent'],
	},
	messageEditing: { borderLeftColor: color['--amber'] },
	meta: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '8px',
		marginBottom: '5px',
		fontSize: deskText.small,
		color: color['--muted'],
	},
	author: {
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		fontWeight: 600,
		color: color['--ink'],
	},
	authorAgent: { color: color['--accent'] },
	time: {
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--muted'],
	},
	// Edit / Delete: out of the way until the message is hovered (or one of
	// them holds the keyboard focus).
	messageActions: {
		display: 'flex',
		gap: '4px',
		marginLeft: 'auto',
		opacity: {
			default: 0,
			':focus-within': 1,
			[messageHover()]: 1,
		},
		transition: 'opacity .12s',
	},
	// A message action runs a step under the thread's mini controls.
	messageAction: {
		minHeight: '20px',
		paddingInline: '6px',
		fontSize: deskText.label,
	},
	// The message's markdown (data-prose="thread" carries the typography).
	body: { marginTop: '6px', overflowWrap: 'break-word' },
	// A resolved thread folds to one line: the count, and its own Reopen.
	summary: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		fontSize: deskText.body,
		lineHeight: '20px',
		color: color['--muted'],
	},
	summaryCount: { fontWeight: 600, color: color['--ink'] },
	summaryReopen: { marginLeft: '6px' },
	foot: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		marginTop: '12px',
		paddingTop: '8px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	// The folded summary carries the Reopen.
	footHidden: { display: 'none' },
})
