import * as stylex from '@stylexjs/stylex'

// The wordmark link (its mark turns on hover), and an ancestor that reports
// how it is being operated through data-input="pointer" | "keyboard" (the
// header does): keyboard operation skips the mark's transition.
export const brandMarker = stylex.defineMarker()
export const inputMarker = stylex.defineMarker()
