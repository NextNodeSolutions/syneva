import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

// The box keeps one height through every state, so the hero never shifts.
const BOX_HEIGHT = '58px'

const settle = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(4px)' },
	to: { opacity: 1, transform: 'none' },
})

export const quickSignup = stylex.create({
	form: { position: 'relative', minWidth: 0, marginBlock: 0 },
	box: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		minHeight: BOX_HEIGHT,
		paddingBlock: '6px',
		paddingLeft: '16px',
		paddingRight: '6px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':focus-within': color['--accent'],
		},
		backgroundColor: color['--white'],
		transition: `border-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
	},
	boxRefused: {
		borderColor: {
			default: color['--red'],
			':focus-within': color['--red'],
		},
	},
	field: { flex: '1 1 auto', display: 'flex', minWidth: 0 },
	input: {
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		backgroundColor: 'transparent',
		width: '100%',
		minWidth: 0,
		paddingBlock: '10px',
		paddingInline: 0,
		font: `15px ${font['--sans']}`,
		color: color['--ink'],
		caretColor: color['--accent'],
		outline: 'none',
		'::placeholder': { color: color['--muted'], opacity: 0.75 },
	},
	send: {
		minHeight: '44px',
		paddingLeft: '16px',
		paddingRight: '14px',
		fontSize: '14px',
	},
	hidden: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		overflow: 'hidden',
		clipPath: 'inset(50%)',
		whiteSpace: 'nowrap',
	},
	// Joined: the verdict's mint and its green check, in the box the address went into.
	joined: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		minHeight: BOX_HEIGHT,
		paddingBlock: '8px',
		paddingInline: '16px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--green-line'],
		backgroundColor: color['--mint-pale'],
		// Focused on joining only so a screen reader reads it: nothing to operate, so no ring.
		outline: 'none',
		animationName: { default: null, [media.motionSafe]: settle },
		animationDuration: duration['--duration-shift'],
		animationTimingFunction: ease['--ease-out'],
	},
	check: {
		flexShrink: 0,
		width: '18px',
		height: '18px',
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 2.4,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	verdict: {
		flexShrink: 0,
		fontSize: '15px',
		fontWeight: 500,
		color: color['--green'],
	},
	address: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		font: `13px ${font['--mono']}`,
		color: color['--ink'],
	},
	// One line held open under the box: the promise, or what stopped the form.
	note: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '4px 9px',
		minHeight: '1.6em',
		marginTop: '10px',
		font: `11.5px/1.6 ${font['--mono']}`,
		color: color['--muted'],
	},
	noteRefused: { color: color['--red'] },
	noteSquare: {
		flexShrink: 0,
		width: '6px',
		height: '6px',
		backgroundColor: 'currentColor',
	},
	leave: {
		paddingBlock: 0,
		paddingInline: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		backgroundColor: 'transparent',
		font: 'inherit',
		color: color['--ink'],
		textDecorationLine: 'underline',
		textDecorationThickness: '1px',
		textUnderlineOffset: '4px',
		textDecorationColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		cursor: 'pointer',
	},
})
