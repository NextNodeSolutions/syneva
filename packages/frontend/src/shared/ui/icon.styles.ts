import * as stylex from '@stylexjs/stylex'

// A sprite icon (<svg><use href="#gly-…">) at the chrome's size. It draws in
// currentColor, so it takes its row's tone; vertical-align tucks an inline
// icon onto the text baseline. Callers size or tint it on top.
export const icon = stylex.create({
	base: {
		width: '14px',
		height: '14px',
		flexShrink: 0,
		verticalAlign: '-0.15em',
	},
	small: { width: '12px', height: '12px' },
	tiny: { width: '11px', height: '11px' },
	large: { width: '15px', height: '15px' },
})
