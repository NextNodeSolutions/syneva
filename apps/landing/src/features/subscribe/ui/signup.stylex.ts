import * as stylex from '@stylexjs/stylex'

// The launch list's sheet: its crop marks close in while a field inside it has focus.
export const sheetMarker = stylex.defineMarker()
// One row of the sheet: its band and gutter mark answer its field's focus.
export const rowMarker = stylex.defineMarker()
// A send button: its arrow steps forward under the pointer.
export const sendMarker = stylex.defineMarker()
// A row of what's waiting, in the verdict: its arrow steps forward under the pointer.
export const comingMarker = stylex.defineMarker()
