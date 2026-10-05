import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const faq = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr 1.5fr',
			[media.stacked]: 'minmax(0, 1fr)',
		},
		gap: { default: '90px', [media.narrow]: '40px', [media.stacked]: 0 },
	},
	title: {
		fontSize: { default: '36px', [media.phone]: '32px' },
	},
	// Stacked, the link closes the heading column: its margin keeps the
	// underline clear of the first question's rule.
	link: {
		marginTop: '22px',
		marginBottom: { default: null, [media.stacked]: '30px' },
	},
})
