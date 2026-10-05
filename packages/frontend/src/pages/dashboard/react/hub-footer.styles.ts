import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font, layout } from '@syneva/design-system/tokens.stylex'

// The site's bottom bar: mono, muted, under a hairline - how the hub answers on the left,
// where it runs on the right; stacked on phones.
export const hubFooter = stylex.create({
	root: {
		display: 'flex',
		flexDirection: { default: 'row', [media.phone]: 'column' },
		justifyContent: 'space-between',
		gap: { default: '20px', [media.phone]: '6px' },
		paddingBlock: '16px',
		paddingInline: layout['--gutter'],
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: '11px',
		lineHeight: 1.5,
		color: color['--muted'],
	},
	// The square sits in the state word's part, before the word.
	dot: { marginRight: '8px' },
})
