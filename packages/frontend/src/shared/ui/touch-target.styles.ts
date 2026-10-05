import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// The height a control keeps for the finger that presses it. A merged min height replaces the
// recipe's whole value, so each one restates its default.
export const touchTarget = stylex.create({
	// A small control (30px, the recipe's) rises to 40px on phones and tablets held upright.
	small: { minHeight: { default: '30px', [media.stacked]: '40px' } },
	// So does a control at the recipe's own size (36px): a header's action.
	regular: { minHeight: { default: '36px', [media.stacked]: '40px' } },
	// A dialog's actions: 44px at every width.
	large: { minHeight: '44px' },
})
