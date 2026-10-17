import { deskVars } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const diffArea = stylex.create({
	area: {
		position: 'relative',
		flex: '1',
		minHeight: 0,
		display: 'flex',
	},
	hidden: { display: 'none' },
	scroller: {
		position: 'relative',
		flex: '1',
		minHeight: 0,
		minWidth: 0,
		overflow: 'auto',
		// The file's name bar is pinned at the top of this scroller (file-header.styles): a row scrolled into view lands under its edge, not under the bar.
		scrollPaddingTop: '42px',
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
})
