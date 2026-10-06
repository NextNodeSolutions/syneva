import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// The insides of the Display and Filter panels: labelled sections parted by hairlines, choice
// tiles, segmented registers and square checks, at the panel's density.
export const menu = stylex.create({
	section: {
		paddingBlock: '10px',
		paddingInline: '12px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	sectionLast: { borderBottomWidth: 0 },
	label: {
		marginBottom: '8px',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	tiles: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		gap: '6px',
	},
	tile: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: '6px',
		paddingBlock: '10px',
		fontFamily: 'inherit',
		fontSize: '12px',
		color: { default: color['--ink'], ':hover': color['--accent'] },
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		cursor: 'pointer',
		transition: `color ${transition.fast}, border-color ${transition.fast}, background-color ${transition.fast}`,
	},
	tileOn: {
		color: color['--accent'],
		backgroundColor: color['--wash'],
		borderColor: color['--accent'],
	},
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		minHeight: '32px',
		fontSize: '13px',
		cursor: 'pointer',
	},
	rowCount: {
		marginLeft: 'auto',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	// A square check: a white box under a strong rule; checked, a petrol square fills it.
	check: {
		appearance: 'none',
		flexShrink: 0,
		width: '14px',
		height: '14px',
		margin: 0,
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':checked': color['--accent'],
		},
		boxShadow: {
			default: null,
			':checked': `inset 0 0 0 2px ${color['--white']}`,
		},
		backgroundImage: {
			default: null,
			':checked': `linear-gradient(${color['--accent']}, ${color['--accent']})`,
		},
		cursor: 'pointer',
	},
	segmented: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
	},
	segment: {
		minHeight: '30px',
		fontFamily: 'inherit',
		fontSize: '12.5px',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		backgroundColor: color['--white'],
		borderWidth: 0,
		cursor: 'pointer',
	},
	segmentOn: { color: color['--accent'], backgroundColor: color['--wash'] },
	reset: {
		fontFamily: 'inherit',
		fontSize: '12.5px',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		backgroundColor: 'transparent',
		borderWidth: 0,
		padding: 0,
		textDecoration: 'underline',
		textUnderlineOffset: '3px',
		cursor: 'pointer',
	},
	trigger: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
	triggerCount: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--accent'],
	},
})
