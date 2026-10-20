import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// An index row, as the projects and the plan library list theirs: a grid of the entry's name
// and its figures, ruled under, its tracks the listing's own (they fold on a narrow page by the
// listing's container).
export const indexRow = stylex.create({
	row: {
		display: 'grid',
		alignItems: 'center',
		columnGap: '20px',
		rowGap: '6px',
		paddingBlock: '16px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	name: {
		display: 'block',
		fontSize: '15px',
		fontWeight: 500,
		letterSpacing: '-.01em',
	},
})
