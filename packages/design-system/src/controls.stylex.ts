import * as stylex from '@stylexjs/stylex'

// Carried by controls whose arrow steps forward on hover: the control adds it, its arrow reads it.
export const controlMarker = stylex.defineMarker()

// The same for a text link: textLink.arrow reads it.
export const textLinkMarker = stylex.defineMarker()
