import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
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
		color: {
			default: color['--ink'],
			[media.finePointer]: {
				default: color['--ink'],
				':hover': color['--accent'],
			},
		},
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			[media.finePointer]: {
				default: color['--line-strong'],
				':hover': color['--accent'],
			},
		},
		cursor: 'pointer',
		transform: { default: null, ':active': 'scale(.97)' },
		transition: `color ${transition.fast}, border-color ${transition.fast}, background-color ${transition.fast}, transform ${transition.fast}`,
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
		color: {
			default: color['--muted'],
			[media.finePointer]: {
				default: color['--muted'],
				':hover': color['--ink'],
			},
		},
		backgroundColor: color['--white'],
		borderWidth: 0,
		cursor: 'pointer',
		transform: { default: null, ':active': 'scale(.97)' },
		transition: `color ${transition.fast}, background-color ${transition.fast}, transform ${transition.fast}`,
	},
	segmentOn: { color: color['--accent'], backgroundColor: color['--wash'] },
	// Disabled (nothing to reset), it reads as unavailable and answers no hover.
	reset: {
		fontFamily: 'inherit',
		fontSize: '12.5px',
		color: {
			default: color['--muted'],
			':hover:not(:disabled)': color['--ink'],
			':disabled': color['--line-strong'],
		},
		backgroundColor: 'transparent',
		borderWidth: 0,
		padding: 0,
		textDecoration: 'underline',
		textUnderlineOffset: '3px',
		cursor: { default: 'pointer', ':disabled': 'default' },
		transition: `color ${transition.fast}`,
	},
	trigger: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
	triggerCount: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--accent'],
	},
})
