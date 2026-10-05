import * as stylex from '@stylexjs/stylex'

// A control whose arrow steps forward while the control is hovered: the
// control carries the marker, its arrow reads it.
export const controlMarker = stylex.defineMarker()

// The same for a text link (textLink.arrow): the link carries the marker.
export const textLinkMarker = stylex.defineMarker()
