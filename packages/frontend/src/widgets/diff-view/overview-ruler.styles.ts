import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The change ruler's ticks, inside #ovr (the strip the diff area overlays on
// the diff's right edge): one square bar per run of added or removed rows, at
// its place in the whole file. A one-line run keeps a visible minimum.
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
