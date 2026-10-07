import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const agentPicker = stylex.create({
	fieldset: {
		minWidth: 0,
		marginBlock: 0,
		marginInline: 0,
		paddingBlock: 0,
		paddingInline: 0,
	},
	// A legend takes no flex layout of its own in older engines: it floats over the fieldset's own box instead.
	legend: { float: 'left', width: '100%', paddingInline: 0 },
	// Six agents, three to a line; two on phones, where the sheet's field column (44px gutter, narrow pads) clips the widest label: the same width keeps every chip equal, so none sits alone on a wrapped line.
	chips: {
		clear: 'both',
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(3, minmax(0, 1fr))',
			[media.phone]: 'repeat(2, minmax(0, 1fr))',
		},
		gap: '8px',
		paddingTop: '12px',
	},
	// The chosen look follows React state, not :has(), so it holds in every engine the site targets.
	chip: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		minWidth: 0,
		minHeight: { default: '38px', [media.phone]: '42px' },
		paddingLeft: '12px',
		paddingRight: '14px',
		fontSize: '14px',
		lineHeight: 1.2,
		whiteSpace: 'nowrap',
		color: color['--ink'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			[media.finePointer]: {
				default: color['--line-strong'],
				':hover': color['--muted'],
			},
		},
		cursor: 'pointer',
		userSelect: 'none',
		transition: `color ${transition.fast}, background-color ${transition.fast}, border-color ${transition.fast}`,
	},
	chipPicked: {
		color: color['--accent'],
		backgroundColor: color['--wash-tint'],
		borderColor: {
			default: color['--accent'],
			[media.finePointer]: {
				default: color['--accent'],
				':hover': color['--accent'],
			},
		},
	},
	// The mark's diamond, the hub's choice radio: filled petrol once ticked.
	diamond: {
		appearance: 'none',
		flexShrink: 0,
		margin: 0,
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
		cursor: 'pointer',
		transition: `background-color ${transition.fast}, border-color ${transition.fast}`,
	},
})
