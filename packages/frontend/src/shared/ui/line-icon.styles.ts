import * as stylex from '@stylexjs/stylex'

// Stroked in the text colour and never filled; the caller sizes it and sets
// the stroke width for its scale.
export const lineIcon = stylex.create({
	base: { flexShrink: 0, fill: 'none', stroke: 'currentColor' },
})
