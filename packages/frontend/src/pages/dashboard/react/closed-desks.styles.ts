import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// Closed desks as a quiet ledger under the live ones: the session and where it was, when it
// closed and how far its review had come, and Reopen at the end.
const NARROW = '@container closed (max-width: 620px)'

export const closedList = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'closed',
		marginTop: '36px',
	},
	head: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '10px',
		paddingBottom: '10px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	title: { fontSize: '15px', fontWeight: 500, letterSpacing: '-.01em' },
	count: {
		fontFamily: font['--mono'],
		fontSize: '12px',
		color: color['--muted'],
	},
	row: {
		display: 'grid',
		gridTemplateColumns: {
			default: '14px minmax(0, 1.2fr) minmax(0, 1fr) auto',
			[NARROW]: '14px minmax(0, 1fr) auto',
		},
		alignItems: 'center',
		columnGap: '16px',
		rowGap: '4px',
		paddingBlock: '13px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	name: { fontSize: '14px', fontWeight: 500, color: color['--muted'] },
	meta: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	progress: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
		gridColumn: { default: 'auto', [NARROW]: '2' },
		gridRow: { default: 'auto', [NARROW]: '2' },
	},
	failure: { gridColumn: '2 / -1', fontSize: '12px', color: color['--red'] },
	empty: { paddingBlock: '16px', fontSize: '13px', color: color['--muted'] },
})
