import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

export const touchTarget = stylex.create({
	small: { minHeight: { default: '30px', [media.stacked]: '40px' } },
	regular: { minHeight: { default: '36px', [media.stacked]: '40px' } },
	large: { minHeight: '44px' },
})
