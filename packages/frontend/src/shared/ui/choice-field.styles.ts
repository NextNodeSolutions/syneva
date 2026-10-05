import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// Radio tiles: one white tile per choice under a strong rule, the chosen one
// in petrol on the wash tint. The fieldset and legend lose the platform's
// frame here (border written as three longhands: `border: 0` alone would
// keep the style and colour).
export const choiceField = stylex.create({
	fieldset: {
		minWidth: 0,
		marginBlock: 0,
		marginInline: 0,
		paddingBlock: 0,
		paddingInline: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
	},
	legend: { marginBottom: '8px', paddingBlock: 0, paddingInline: 0 },
	grid: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(2, minmax(0, 1fr))',
			[media.smallPhone]: 'minmax(0, 1fr)',
		},
		gap: '8px',
	},
	tile: {
		display: 'grid',
		gridTemplateColumns: '12px minmax(0, 1fr)',
		columnGap: '12px',
		alignItems: 'start',
		paddingBlock: '12px',
		paddingInline: '14px',
		cursor: 'pointer',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--muted'],
		},
		backgroundColor: color['--white'],
		transition: `border-color ${transition.fast}, background-color ${transition.fast}`,
	},
	tileOn: {
		borderColor: {
			default: color['--accent'],
			':hover': color['--accent'],
		},
		backgroundColor: color['--wash-tint'],
	},
	// The native radio, redrawn as the diamond at the brand mark's centre: a
	// hollow square is the checkbox glyph, and would read as a multiple choice.
	// Arrow keys and Space still move the choice; centred on the title's first
	// line.
	radio: {
		appearance: 'none',
		justifySelf: 'center',
		marginTop: '5px',
		marginBottom: 0,
		marginInline: 0,
		width: '9px',
		height: '9px',
		transform: 'rotate(45deg)',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':checked': color['--accent'],
		},
		backgroundColor: {
			default: color['--white'],
			':checked': color['--accent'],
		},
		boxShadow: {
			default: null,
			':checked': `inset 0 0 0 1.5px ${color['--white']}`,
		},
	},
	title: {
		display: 'block',
		fontSize: '14px',
		fontWeight: 500,
		lineHeight: 1.35,
	},
	titleOn: { color: color['--accent'] },
	detail: {
		display: 'block',
		marginTop: '3px',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		color: color['--muted'],
		overflowWrap: 'anywhere',
	},
})
