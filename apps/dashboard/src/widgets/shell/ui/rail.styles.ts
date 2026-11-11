import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const rail = stylex.create({
	bar: {
		justifyContent: { default: 'center', [media.stacked]: 'flex-start' },
		paddingInline: { default: 0, [media.stacked]: '16px' },
	},
	nav: {
		alignItems: 'center',
	},
})
