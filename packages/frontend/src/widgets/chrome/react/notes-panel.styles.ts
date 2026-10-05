import { deskSize, deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

const fast = `${duration['--duration-fast']} ${ease['--ease-out']}`
const PAD = '10px'

// The review-notes ledger: every thread of the review, on the paper chrome to
// the diff's right behind its own rule. Its head shares the guide bar's height
// so the two bottom rules read as one line across the seam. On tablets it is
// the file drawer's mirror: a right drawer over the diff.
export const notes = stylex.create({
	aside: {
		display: 'flex',
		flexDirection: 'column',
		minWidth: 0,
		minHeight: 0,
		backgroundColor: color['--paper'],
		borderLeftWidth: '1px',
		borderLeftStyle: 'solid',
		borderLeftColor: {
			default: color['--line'],
			[media.tablet]: color['--line-strong'],
		},
		position: { default: null, [media.tablet]: 'fixed' },
		top: { default: null, [media.tablet]: deskSize.topbar },
		right: { default: null, [media.tablet]: 0 },
		bottom: { default: null, [media.tablet]: 0 },
		width: { default: null, [media.tablet]: 'min(86vw, 360px)' },
		zIndex: { default: null, [media.tablet]: 30 },
	},
	head: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		height: deskSize.subbar,
		paddingInline: PAD,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	close: { marginLeft: 'auto' },
	tools: {
		flexShrink: 0,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: '8px',
		paddingBlock: '8px',
		paddingInline: PAD,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	// The filter: a white well whose whole rule lifts on focus.
	search: {
		alignSelf: 'stretch',
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		paddingBlock: '4px',
		paddingInline: '8px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':focus-within': color['--accent'],
		},
		transition: `border-color ${fast}`,
	},
	input: {
		flex: '1 1 auto',
		minWidth: 0,
		padding: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		outline: 'none',
		fontSize: deskText.body,
		color: color['--ink'],
		caretColor: color['--accent'],
		'::placeholder': { color: color['--muted'], opacity: 0.75 },
	},
	body: {
		flex: '1 1 auto',
		minHeight: 0,
		overflow: 'auto',
		padding: PAD,
	},
	empty: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: '6px',
		paddingBlock: '8px',
		paddingInline: '2px',
		fontSize: deskText.body,
		lineHeight: 1.6,
		color: color['--muted'],
	},
	clear: {
		padding: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		fontSize: deskText.body,
		color: color['--accent'],
		textDecoration: { default: 'none', ':hover': 'underline' },
		textUnderlineOffset: '3px',
		cursor: 'pointer',
	},
	section: { marginTop: { default: 0, ':not(:first-child)': '16px' } },
	label: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		marginBottom: '6px',
	},
	labelCount: {
		fontVariantNumeric: 'tabular-nums',
		color: color['--ink'],
	},
	none: {
		paddingBottom: '6px',
		fontSize: deskText.small,
		color: color['--muted'],
	},
	file: { marginTop: { default: 0, ':not(:first-of-type)': '10px' } },
	// The file a group of rows is on, held while its rows scroll under it;
	// full-bleed so the rule reads across the pane's padding.
	fileName: {
		position: 'sticky',
		top: `-${PAD}`,
		zIndex: 2,
		marginInline: `-${PAD}`,
		marginBottom: '4px',
		paddingBlock: '5px',
		paddingInline: PAD,
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		fontWeight: 600,
		color: color['--ink'],
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
})

// One thread row: where, status, the opening line, the agent's reply on an
// answered question. The keyboard cursor sits on the petrol wash; the file on
// screen is marked by a short petrol rail, the tree's active language.
export const note = stylex.create({
	row: {
		position: 'relative',
		display: 'block',
		width: '100%',
		marginBlock: '2px',
		paddingBlock: '7px',
		paddingInline: '9px',
		textAlign: 'left',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: 'transparent',
			':hover': color['--line'],
		},
		backgroundColor: {
			default: 'transparent',
			':hover': color['--white'],
		},
		color: { default: color['--muted'], ':hover': color['--ink'] },
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		lineHeight: 1.5,
		cursor: 'pointer',
		transition: `background-color ${fast}, border-color ${fast}`,
	},
	resolved: { opacity: { default: 0.55, ':hover': 1 } },
	cursor: {
		color: { default: color['--ink'], ':hover': color['--ink'] },
		backgroundColor: {
			default: color['--wash'],
			':hover': color['--wash'],
		},
		borderColor: {
			default: color['--accent-line'],
			':hover': color['--accent-line'],
		},
	},
	current: {
		'::before': {
			content: '""',
			position: 'absolute',
			left: '-1px',
			top: '7px',
			bottom: '7px',
			width: '2px',
			backgroundColor: color['--accent'],
		},
	},
	top: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		marginBottom: '3px',
	},
	where: {
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	flag: {
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		color: color['--amber'],
	},
	status: { marginLeft: 'auto' },
	clamp: {
		display: '-webkit-box',
		WebkitLineClamp: 2,
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
	},
	body: { color: color['--ink'] },
	reply: {
		marginTop: '3px',
		paddingLeft: '8px',
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--accent-line'],
		color: color['--muted'],
	},
})
