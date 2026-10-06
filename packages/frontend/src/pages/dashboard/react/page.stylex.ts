import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// The dashboard page's side gutter: where every part of a page starts and ends (its head, its
// filter chips, its list, a section, the circuit's band), so their edges line up down the page.
export const pageInset = stylex.defineVars({
	gutter: { default: '32px', [media.stacked]: '16px' },
})
