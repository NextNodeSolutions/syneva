import { deskVars } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The diff area: the scroller the diff island renders into (#diff), the change
// ruler overlaid on its right edge (#ovr, fixed while #diff scrolls under it)
// and the floating sign-off.
export const diffArea = stylex.create({
	area: {
		position: 'relative',
		flex: '1',
		minHeight: 0,
		display: 'flex',
	},
	// Everything in #diff inherits the chrome's voice at the code size; the
	// rows themselves take Settings' code font through --diffs-font-family.
	// @pierre reserves a right-side scrollbar gutter, but #diff is the one
	// scroller, so the gutter is dropped.
	scroller: {
		position: 'relative',
		flex: '1',
		minHeight: 0,
		minWidth: 0,
		overflow: 'auto',
		backgroundColor: color['--white'],
		fontFamily: font['--sans'],
		fontSize: deskVars['--code-size'],
		lineHeight: 1.62,
		'--diffs-scrollbar-gutter-override': '0px',
		'--diffs-header-font-family': font['--sans'],
	},
	ruler: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		width: '8px',
		zIndex: 6,
		pointerEvents: 'none',
	},
	// The header's Approve scrolls away on a long file, so its twin floats in
	// the same corner once the diff is scrolled: the same verdict button,
	// lifted off the code like every floating layer.
	fab: {
		position: 'absolute',
		top: '12px',
		right: '20px',
		zIndex: 9,
		boxShadow: '0 12px 32px rgb(25 27 24 / 14%)',
	},
})
