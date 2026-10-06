import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The folded rail's labels: the desk's fast tooltip (shared/ui/tip.styles) opening at the
// rail's right, beside the icon it names. One fixed layer outside the sidebar, placed by
// rail-tips.ts: the sidebar clips what passes its edge (it folds by narrowing), and so does
// the desk rail's panel.
export const railTip = stylex.create({
	tip: {
		position: 'fixed',
		top: 0,
		left: 0,
		zIndex: 60,
		paddingBlock: '5px',
		paddingInline: '8px',
		whiteSpace: 'nowrap',
		pointerEvents: 'none',
		fontFamily: font['--sans'],
		fontSize: '12px',
		lineHeight: 1.3,
		color: color['--paper'],
		backgroundColor: color['--ink'],
		opacity: 0,
		transitionProperty: 'opacity',
		transitionDuration: '.1s',
	},
})
