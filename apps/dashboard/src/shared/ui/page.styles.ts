import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const page = stylex.create({
	inset: {
		paddingInline: { default: '32px', [media.phone]: '16px' },
	},
	body: {
		paddingBlock: '24px 48px',
	},
})
