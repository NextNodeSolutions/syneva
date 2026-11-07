import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// The launch list's sheet: its crop marks close in while a field inside it has focus.
export const sheetMarker = stylex.defineMarker()
// One row of the sheet: its band and gutter mark answer its field's focus.
export const rowMarker = stylex.defineMarker()
// A row of what's waiting, in the verdict: its arrow steps forward under the pointer.
export const comingMarker = stylex.defineMarker()

// The sheet's inner margin, which its bar, foot, verdict and terms share.
export const sheet = stylex.defineVars({
	inset: { default: '20px', [media.phone]: '14px' },
})
