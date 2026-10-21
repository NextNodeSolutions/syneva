import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The aside's versions, newest first: the one on screen marked, each with when it was posted
// and whether a Send approved it.
export const planVersions = stylex.create({
	head: {
		paddingBottom: '8px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	item: {
		display: 'grid',
		gridTemplateColumns: '36px minmax(0, 1fr)',
		alignItems: 'baseline',
		width: '100%',
		paddingBlock: '9px',
		paddingInline: '4px',
		textAlign: 'left',
		fontFamily: font['--mono'],
		fontSize: '12px',
		color: color['--ink'],
		backgroundColor: {
			default: 'transparent',
			':hover': color['--white'],
		},
		borderWidth: 0,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		cursor: 'pointer',
	},
	current: {
		backgroundColor: color['--wash-tint'],
		boxShadow: `inset 2px 0 0 ${color['--accent']}`,
	},
	number: { fontWeight: 500 },
	meta: { color: color['--muted'] },
	approved: { color: color['--green'] },
	facts: {
		display: 'grid',
		gap: '10px',
		fontSize: '13px',
	},
	fact: { display: 'grid', gap: '2px', minWidth: 0 },
	factValue: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontFamily: font['--mono'],
		fontSize: '12px',
	},
})
