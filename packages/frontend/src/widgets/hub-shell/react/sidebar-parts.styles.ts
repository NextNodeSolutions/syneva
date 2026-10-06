import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The sidebar's own pieces around its lists: the wordmark at the app's scale, the New review
// action, and the fold control.
export const sidebarParts = stylex.create({
	brand: {
		minWidth: 0,
		fontSize: '20px',
		lineHeight: 1,
		color: color['--ink'],
		textDecoration: 'none',
	},
	mark: { width: '22px', height: '22px', flexShrink: 0 },
	product: {
		position: 'relative',
		top: '2px',
		paddingLeft: '8px',
		marginLeft: '2px',
		borderLeftWidth: '1px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--line-strong'],
		fontFamily: font['--mono'],
		fontSize: '11px',
		fontWeight: 400,
		letterSpacing: '.02em',
		color: color['--muted'],
	},
	newReview: {
		justifyContent: 'flex-start',
		gap: '10px',
		marginTop: '10px',
		marginInline: '8px',
		paddingInline: '11px',
		overflow: 'hidden',
	},
	newReviewKey: { marginLeft: 'auto' },
	foldIcon: { width: '16px', height: '16px' },
	foldButton: {
		width: '32px',
		minHeight: '32px',
		paddingInline: 0,
	},
})
