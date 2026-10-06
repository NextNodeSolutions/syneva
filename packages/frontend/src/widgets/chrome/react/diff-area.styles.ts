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
	fab: {
		position: 'absolute',
		top: '12px',
		right: '20px',
		zIndex: 9,
		boxShadow: '0 12px 32px rgb(25 27 24 / 14%)',
	},
})
