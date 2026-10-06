import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

export const fieldText = stylex.create({
	labelRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		gap: '12px',
		width: '100%',
	},
	label: {
		fontSize: '13px',
		fontWeight: 500,
		lineHeight: '18px',
		color: color['--ink'],
	},
	// The row is the field: a bare line of text over one rule, petrol while it has focus.
	input: {
		display: 'block',
		width: '100%',
		minWidth: 0,
		marginTop: '6px',
		paddingTop: '6px',
		paddingBottom: '7px',
		paddingInline: 0,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: {
			default: color['--line'],
			':hover': color['--line-strong'],
			':focus': color['--accent'],
		},
		borderRadius: 0,
		backgroundColor: 'transparent',
		font: `17px/1.4 ${font['--sans']}`,
		fontSize: { default: null, [media.phone]: '16px' },
		letterSpacing: '-.01em',
		color: color['--ink'],
		caretColor: color['--accent'],
		outline: 'none',
		transition: `border-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
		'::placeholder': { color: color['--muted'], opacity: 0.6 },
	},
	inputRefused: {
		borderBottomColor: {
			default: color['--red'],
			':hover': color['--red'],
			':focus': color['--red'],
		},
	},
	problem: {
		display: 'flex',
		alignItems: 'center',
		gap: '9px',
		marginTop: '9px',
		fontSize: '13px',
		lineHeight: 1.45,
		color: color['--red'],
	},
	// A form's status line, held open so a refusal never shifts what follows: the send under way, or what stopped it.
	status: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '4px 9px',
		minHeight: '1.6em',
		marginTop: '10px',
		font: `11.5px/1.6 ${font['--mono']}`,
		color: color['--muted'],
	},
	statusRefused: { color: color['--red'] },
})
