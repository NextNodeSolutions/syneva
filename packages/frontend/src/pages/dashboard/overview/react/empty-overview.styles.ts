import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The empty overview: a centred composition on the page column, never a column pushed to one
// side and never stretched across it. The hero (the review loop at rest, the statement, the
// ways to open a desk) stands in the middle; the desks closed before follow under it in a
// centred ledger of a reading width.
const PHONE = media.stacked
// A group head's path drops under its name before it would cut to nothing.
const NARROW_CLOSED = '@container closed (max-width: 479px)'

export const emptyOverview = stylex.create({
	page: {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100%',
		paddingInline: { default: '32px', [PHONE]: '16px' },
		paddingBottom: { default: '72px', [PHONE]: '48px' },
	},
	hero: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		textAlign: 'center',
		paddingTop: { default: '64px', [PHONE]: '28px' },
	},
	// With no history under it, the hero takes the page's height and sits a little above its
	// middle (the optical centre).
	heroAlone: {
		flex: '1 0 auto',
		justifyContent: 'center',
		paddingTop: { default: '48px', [PHONE]: '28px' },
		paddingBottom: { default: '96px', [PHONE]: '28px' },
	},
	title: {
		marginTop: { default: '40px', [PHONE]: '28px' },
		fontSize: { default: '30px', [PHONE]: '24px' },
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1.12,
		textWrap: 'balance',
	},
	lede: {
		maxWidth: '58ch',
		marginTop: '12px',
		fontSize: { default: '14.5px', [PHONE]: '13.5px' },
		lineHeight: 1.6,
		color: color['--muted'],
		textWrap: 'balance',
	},
	// The row gap clears the command box's status line, which hangs 6px under it, out of flow.
	// New review takes the command box's height, so the two read as one row of controls.
	ways: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'stretch',
		justifyContent: 'center',
		columnGap: '16px',
		rowGap: '26px',
		width: '100%',
		maxWidth: '680px',
		marginTop: { default: '30px', [PHONE]: '24px' },
	},
	command: {
		flex: { default: '0 1 300px', [PHONE]: '1 1 100%' },
		minWidth: 0,
		textAlign: 'left',
	},
})

export const resumeLedger = stylex.create({
	// The `closed` container the closed rows' own narrow layout reads (closed-desks.styles.ts).
	root: {
		boxSizing: 'border-box',
		width: '100%',
		maxWidth: '880px',
		marginInline: 'auto',
		marginTop: { default: '72px', [PHONE]: '48px' },
		containerType: 'inline-size',
		containerName: 'closed',
	},
	head: {
		display: 'flex',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: '16px',
	},
	heading: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		fontWeight: 400,
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	group: { marginTop: '22px' },
	path: {
		order: { default: null, [NARROW_CLOSED]: 9 },
		flexGrow: { default: 1, [NARROW_CLOSED]: 0 },
		flexBasis: { default: 0, [NARROW_CLOSED]: '100%' },
	},
	newReview: { marginLeft: 'auto', alignSelf: 'center' },
	allArrow: { width: '14px', height: '14px' },
})
