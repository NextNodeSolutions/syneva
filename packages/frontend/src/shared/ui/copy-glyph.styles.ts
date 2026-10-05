import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease } from '@syneva/design-system/tokens.stylex'

const checkIn = stylex.keyframes({
	from: { transform: 'scale(.4)' },
	to: { transform: 'none' },
})

const sheet = {
	width: '18px',
	height: '18px',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.5,
} as const

// The copy glyph: two sheets in the button's ink, then a green check that springs in.
export const copyGlyph = stylex.create({
	sheets: sheet,
	check: {
		...sheet,
		stroke: color['--green'],
		animationName: { default: null, [media.motionSafe]: checkIn },
		animationDuration: '.35s',
		animationTimingFunction: ease['--ease-spring'],
	},
})
