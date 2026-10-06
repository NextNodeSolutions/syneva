import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// The repositories as index rows: the whole row is the link to its page; its name and where it
// lives, then its live desks, what waits on you there, its rounds this week and its last move.
const NARROW = '@container projects (max-width: 760px)'

export const projectsList = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'projects',
		marginTop: '22px',
	},
	head: {
		display: { default: 'grid', [NARROW]: 'none' },
		gridTemplateColumns:
			'minmax(0, 2fr) repeat(3, minmax(0, 1fr)) minmax(0, 1fr) 20px',
		columnGap: '20px',
		paddingBottom: '10px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	row: {
		display: 'grid',
		gridTemplateColumns: {
			default:
				'minmax(0, 2fr) repeat(3, minmax(0, 1fr)) minmax(0, 1fr) 20px',
			[NARROW]: 'minmax(0, 1fr) auto',
		},
		alignItems: 'center',
		columnGap: '20px',
		rowGap: '6px',
		paddingBlock: '16px',
		paddingInline: '4px',
		color: color['--ink'],
		textDecoration: 'none',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		backgroundColor: { default: 'transparent', ':hover': color['--white'] },
		transition: `background-color ${transition.fast}`,
	},
	who: { minWidth: 0 },
	name: {
		display: 'block',
		fontSize: '15px',
		fontWeight: 500,
		letterSpacing: '-.01em',
	},
	path: {
		display: 'block',
		marginTop: '3px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	figure: {
		display: { default: 'block', [NARROW]: 'none' },
		fontFamily: font['--mono'],
		fontSize: '13px',
	},
	figureMuted: { color: color['--muted'] },
	yours: { color: color['--accent'] },
	summary: {
		display: { default: 'none', [NARROW]: 'block' },
		gridColumn: '1 / -1',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	arrow: { width: '18px', height: '18px', color: color['--muted'] },
})
