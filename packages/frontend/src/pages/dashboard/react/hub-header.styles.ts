import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

// The site's header at app height: the brand on the left, the page's actions on the right,
// a hairline under them.
export const hubHeader = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: { default: '24px', [media.smallPhone]: '12px' },
		minHeight: { default: '76px', [media.phone]: '64px' },
		paddingInline: {
			default: layout['--gutter'],
			[media.tinyPhone]: '16px',
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	actions: {
		display: 'flex',
		alignItems: 'center',
		gap: { default: '20px', [media.phone]: '14px' },
	},
})
