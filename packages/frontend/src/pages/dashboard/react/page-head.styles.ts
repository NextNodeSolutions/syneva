import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Hidden for the animation's whole run, then shown: the loading statement waits out a hub that
// answers at once, so it never flashes. With motion reduced the shell drops the animation and
// the line shows at once.
const holdBack = stylex.keyframes({
	from: { visibility: 'hidden' },
	to: { visibility: 'hidden' },
})

// Every page's head: the statement (the page's one h1, at the desk's page-headline size), the
// line under it, and the page's own controls at its right; a hairline closes it. On phones the
// controls drop under the statement.
const PHONE = media.stacked

export const pageHead = stylex.create({
	root: {
		display: 'flex',
		alignItems: { default: 'flex-end', [PHONE]: 'flex-start' },
		flexDirection: { default: 'row', [PHONE]: 'column' },
		justifyContent: 'space-between',
		gap: { default: '24px', [PHONE]: '14px' },
		paddingTop: { default: '30px', [PHONE]: '22px' },
		paddingBottom: '20px',
		paddingInline: { default: '32px', [PHONE]: '16px' },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	statement: { minWidth: 0, maxWidth: '72ch' },
	title: {
		fontSize: { default: '26px', [PHONE]: '23px' },
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1.12,
		textWrap: 'balance',
	},
	pending: {
		color: color['--muted'],
		animationName: holdBack,
		animationDuration: '600ms',
	},
	lede: {
		marginTop: '8px',
		fontSize: '13.5px',
		lineHeight: 1.55,
		color: color['--muted'],
	},
	actions: {
		display: 'flex',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '8px',
		flexShrink: 0,
	},
})
