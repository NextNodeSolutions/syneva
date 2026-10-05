import * as stylex from '@stylexjs/stylex'

// The fill's share of the track, set per render: a dynamic style, so the
// recipe's transition eases a change of share instead of jumping.
export const meterShare = stylex.create({
	scale: (fraction: number) => ({ transform: `scaleX(${fraction})` }),
})
