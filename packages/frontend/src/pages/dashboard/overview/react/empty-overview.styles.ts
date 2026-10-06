import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The empty overview: one column on the page's inset, never centred and never stretched (the
// paper beside it stays empty). Open a desk first, then the desks closed before, by repository.
const PHONE = media.stacked
// The command takes its own line once the ways in no longer fit beside it.
const NARROW_LAUNCH = '@container launch (max-width: 559px)'
// A group head's path drops under its name before it would cut to nothing.
const NARROW_CLOSED = '@container closed (max-width: 479px)'

export const emptyOverview = stylex.create({
	page: { minHeight: '100%' },
	body: {
		paddingTop: { default: '28px', [PHONE]: '22px' },
		paddingInline: { default: '32px', [PHONE]: '16px' },
		paddingBottom: { default: '56px', [PHONE]: '40px' },
	},
	column: {
		maxWidth: '720px',
		containerType: 'inline-size',
		containerName: 'launch',
	},
	lede: {
		maxWidth: '62ch',
		marginTop: '14px',
		fontSize: '13.5px',
		lineHeight: 1.55,
		color: color['--muted'],
		textWrap: 'pretty',
	},
	// The row gap clears the command box's status line, which hangs 6px under it, out of flow.
	ways: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		columnGap: '20px',
		rowGap: '26px',
		marginTop: '16px',
	},
	command: {
		flex: { default: '0 1 320px', [NARROW_LAUNCH]: '1 1 100%' },
		minWidth: 0,
	},
	actions: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '12px 20px',
	},
})

export const resumeLedger = stylex.create({
	// The `closed` container the closed rows' own narrow layout reads (closed-desks.styles.ts).
	root: {
		marginTop: { default: '48px', [PHONE]: '40px' },
		containerType: 'inline-size',
		containerName: 'closed',
	},
	group: { marginTop: { default: '28px', ':first-child': '0' } },
	// The path takes the head's room left over, cut from its start (the ledger's meta), so the
	// head holds one line; from narrow columns it has a line of its own under the name.
	path: {
		order: { default: null, [NARROW_CLOSED]: 9 },
		flexGrow: { default: 1, [NARROW_CLOSED]: 0 },
		flexBasis: { default: 0, [NARROW_CLOSED]: '100%' },
	},
	newReview: { marginLeft: 'auto', alignSelf: 'center' },
	foot: { marginTop: '16px' },
	allArrow: { width: '14px', height: '14px' },
})
