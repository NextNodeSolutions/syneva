import * as stylex from '@stylexjs/stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

// A frame-wide red band under the header: the page's one error surface, a red square, the
// lead in ink and what to do in muted.
export const unreachableStrip = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: '8px minmax(0, 1fr)',
		columnGap: '12px',
		alignItems: 'start',
		paddingBlock: '14px',
		paddingInline: layout['--gutter'],
		backgroundColor: color['--red-pale'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--red-line'],
		fontSize: '14px',
		lineHeight: 1.55,
	},
	square: {
		width: '8px',
		height: '8px',
		marginTop: '7px',
		backgroundColor: color['--red'],
	},
	lead: { fontWeight: 500, color: color['--ink'] },
	rest: { color: color['--muted'] },
})
