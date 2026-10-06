import * as stylex from '@stylexjs/stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

// The arrival wash: a just-recorded event lands on the petrol wash and settles into the list,
// so the eye finds what moved without anything changing place.
const arrive = stylex.keyframes({
	'0%': { backgroundColor: color['--wash'], transform: 'translateY(-4px)' },
	'30%': { transform: 'none' },
	'100%': { backgroundColor: 'transparent' },
})

// The journal as a ruled ledger: the time in mono, the event's square, its sentence and the
// desk it is about.
export const journalFeed = stylex.create({
	list: { display: 'flex', flexDirection: 'column' },
	row: {
		display: 'grid',
		gridTemplateColumns: '48px 10px minmax(0, 1fr)',
		alignItems: 'baseline',
		columnGap: '10px',
		paddingBlock: '9px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: '12.5px',
		lineHeight: 1.45,
	},
	fresh: {
		animationName: arrive,
		animationDuration: '1.4s',
		animationTimingFunction: ease['--ease-out'],
	},
	time: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	dot: { transform: 'translateY(-1px)' },
	text: { minWidth: 0, overflowWrap: 'anywhere' },
	desk: {
		display: 'block',
		marginTop: '2px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		color: color['--muted'],
	},
	deskLink: {
		color: { default: color['--muted'], ':hover': color['--accent'] },
		textDecoration: { default: 'none', ':hover': 'underline' },
		textUnderlineOffset: '3px',
	},
	empty: {
		paddingBlock: '14px',
		fontSize: '12.5px',
		color: color['--muted'],
	},
})
