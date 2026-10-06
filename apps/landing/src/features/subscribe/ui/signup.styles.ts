import * as stylex from '@stylexjs/stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

// border: 0 resets style and colour too, not just the width.
const noBorder = {
	borderWidth: 0,
	borderStyle: 'none',
	borderColor: 'currentcolor',
} as const

export const signup = stylex.create({
	form: { position: 'relative', minWidth: 0 },
	box: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		padding: '6px 6px 6px 16px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':focus-within': color['--ink'],
		},
		backgroundColor: color['--white'],
		transition: `border-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
	},
	// Merging over the box replaces its whole border value, so this rule restates the focus state.
	onWash: {
		borderColor: {
			default: color['--accent-line'],
			':focus-within': color['--ink'],
		},
		backgroundColor: color['--paper'],
	},
	// The label wraps the field, so several forms on a page need no ids.
	field: { flex: '1 1 auto', display: 'flex', minWidth: 0 },
	input: {
		...noBorder,
		backgroundColor: 'transparent',
		width: '100%',
		minWidth: 0,
		padding: '10px 0',
		font: `15px ${font['--sans']}`,
		color: color['--ink'],
		caretColor: color['--accent'],
		outline: { default: null, ':focus-visible': 'none' },
		'::placeholder': { color: color['--muted'] },
	},
	submit: {
		...noBorder,
		flexShrink: 0,
		minHeight: '44px',
		paddingInline: '16px',
		fontWeight: 500,
		fontSize: '14px',
		color: color['--white'],
		backgroundColor: {
			default: color['--accent'],
			':hover': color['--accent-deep'],
		},
		cursor: { default: 'pointer', ':disabled': 'progress' },
	},
	hidden: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		overflow: 'hidden',
		clipPath: 'inset(50%)',
		whiteSpace: 'nowrap',
	},
	trap: { position: 'absolute', left: '-10000px', top: 0 },
	// One line held open, so the outcome never shifts what follows.
	status: {
		minHeight: '1.6em',
		marginTop: '8px',
		font: `11.5px/1.6 ${font['--mono']}`,
		color: {
			default: color['--muted'],
			':is(.is-done)': color['--green'],
			':is(.is-error)': color['--red'],
		},
	},
})
