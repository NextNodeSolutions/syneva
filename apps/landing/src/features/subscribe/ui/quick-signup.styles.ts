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
	// The compact size of the hero's button, over the site's primary one; restated under the phone query its own sizes use.
	send: {
		minHeight: { default: '44px', [media.phone]: '44px' },
		gap: { default: '14px', [media.phone]: '14px' },
		padding: { default: '0 14px 0 16px', [media.phone]: '0 14px 0 16px' },
		fontSize: { default: '14px', [media.phone]: '14px' },
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
})
