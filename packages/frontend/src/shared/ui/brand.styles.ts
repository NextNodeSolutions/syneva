import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The app's additions to the shared wordmark (@syneva/design-system/brand.styles): a link that
// sets its own ink and line (the desk's shell has no reset), and the product it names after a
// rule, which gives way first on the smallest phones.
export const appBrand = stylex.create({
	link: {
		lineHeight: 1,
		color: color['--ink'],
		textDecoration: 'none',
	},
	mark: { flexShrink: 0 },
	rule: {
		width: '1px',
		height: '18px',
		marginLeft: '5px',
		marginRight: '2px',
		backgroundColor: color['--line-strong'],
		display: { default: 'block', [media.smallPhone]: 'none' },
	},
	product: {
		position: 'relative',
		top: '2px',
		fontFamily: font['--mono'],
		fontSize: '12px',
		fontWeight: 400,
		letterSpacing: '.02em',
		color: color['--muted'],
		display: { default: 'inline', [media.smallPhone]: 'none' },
	},
})
