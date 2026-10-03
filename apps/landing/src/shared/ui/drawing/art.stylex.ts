import * as stylex from '@stylexjs/stylex'

// Every drawing's root <svg>: phones restyle its words by the frame it
// declares (data-compact reframes, .is-dense diagrams grow their labels).
export const drawingMarker = stylex.defineMarker()
