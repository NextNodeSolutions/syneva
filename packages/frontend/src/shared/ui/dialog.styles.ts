import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

const rise = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'none' },
})

const veil = stylex.keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
})

// The sheet hangs from a fixed line near the top, never from the centre: when it grows (a
// field joins it), it grows downwards and what is under the pointer stays where it was.
const TOP = 'min(10dvh, 80px)'
const ROOM = `calc(100dvh - ${TOP} - 16px)`

// The site's focus object: a white sheet under an ink rule, no radius and no
// shadow, over a paper scrim. `display` is never set on the dialog itself: it
// would override the platform's display:none for a closed one, so the column
// lives on `inner`.
export const dialog = stylex.create({
	root: {
		paddingBlock: 0,
		paddingInline: 0,
		marginTop: TOP,
		marginInline: 'auto',
		marginBottom: 'auto',
		width: {
			default: 'min(560px, calc(100vw - 32px))',
			[media.phone]: 'calc(100vw - 24px)',
		},
		maxWidth: 'none',
		maxHeight: ROOM,
		overflow: 'hidden',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--ink'],
		borderRadius: 0,
		backgroundColor: color['--white'],
		color: color['--ink'],
		boxShadow: 'none',
		animationName: { default: null, [media.motionSafe]: rise },
		animationDuration: '200ms',
		animationTimingFunction: ease['--ease-out'],
		// A literal paper scrim: older engines do not inherit custom
		// properties into ::backdrop. It fades in with the sheet's rise.
		'::backdrop': {
			backgroundColor: 'rgba(246, 246, 240, 0.82)',
			animationName: veil,
			animationDuration: '200ms',
			animationTimingFunction: ease['--ease-out'],
		},
	},
	inner: {
		display: 'flex',
		flexDirection: 'column',
		maxHeight: ROOM,
	},
	bar: {
		display: 'flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '16px',
		minHeight: '44px',
		// Level with the body's text below it.
		paddingLeft: { default: '24px', [media.phone]: '20px' },
		paddingRight: '7px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: '11px',
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		color: color['--ink'],
	},
	caption: { display: 'flex', alignItems: 'center', minWidth: 0 },
	captionDot: { marginRight: '10px' },
	// The one part that scrolls when the sheet is taller than the viewport.
	body: {
		flex: '1 1 auto',
		minHeight: 0,
		overflowY: 'auto',
		paddingTop: { default: '26px', [media.phone]: '20px' },
		paddingInline: { default: '24px', [media.phone]: '20px' },
		paddingBottom: '8px',
	},
	// The actions row, at its end with the primary last, at every width: the
	// secondary is a text link, which keeps its own width beside the primary
	// (a phone's row holds both) rather than floating in a share of the row.
	footer: {
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'flex-end',
		alignItems: 'center',
		gap: '8px',
		paddingBlock: { default: '20px', [media.phone]: '16px' },
		paddingInline: { default: '24px', [media.phone]: '20px' },
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
})
