import * as stylex from '@stylexjs/stylex'

// An ancestor that reports how the page is being operated through
// data-input="pointer" | "keyboard" (the header does): keyboard operation
// skips the wordmark mark's transition.
export const inputMarker = stylex.defineMarker()
