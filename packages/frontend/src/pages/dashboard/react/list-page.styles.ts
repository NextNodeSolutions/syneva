import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// A listing page's body under its head: the ledger and what follows it, inset like the head.
export const listPage = stylex.create({
	page: {
		containerType: 'inline-size',
		containerName: 'page',
		minHeight: '100%',
	},
	body: {
		paddingInline: { default: '32px', [media.stacked]: '16px' },
		paddingBottom: '56px',
	},
})
