import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { messageMarker } from './comment-thread.stylex'

const messageHover = (): string => stylex.when.ancestor(':hover', messageMarker)

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
	composer: { padding: '11px 16px 12px' },
})

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
	messageAction: {
		minHeight: '20px',
		paddingInline: '6px',
		fontSize: deskText.label,
	},
	body: { marginTop: '6px', overflowWrap: 'break-word' },
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
	footHidden: { display: 'none' },
})
