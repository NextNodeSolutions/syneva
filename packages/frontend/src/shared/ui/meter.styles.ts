import * as stylex from '@stylexjs/stylex'

export const meterShare = stylex.create({
	scale: (fraction: number) => ({ transform: `scaleX(${fraction})` }),
})
