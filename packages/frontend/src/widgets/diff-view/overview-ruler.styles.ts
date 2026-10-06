import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const rulerTick = stylex.create({
	base: {
		position: 'absolute',
		left: '1px',
		right: '1px',
		minHeight: '2px',
		opacity: 0.85,
	},
	add: { backgroundColor: color['--green'] },
	del: { backgroundColor: color['--red'] },
})
