import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The board: a column per turn, in the order the round runs, the reviewer's own first. Columns
// part on hairlines; a column's head carries its square, its name and its count. Narrower than
// four comfortable columns, the board takes two rows of two, then one.
// Exclusive ranges: StyleX does not order overlapping container queries.
const TWO = '@container board (min-width: 561px) and (max-width: 980px)'
const ONE = '@container board (max-width: 560px)'

export const board = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'board',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	columns: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, minmax(0, 1fr))',
			[TWO]: 'repeat(2, minmax(0, 1fr))',
			[ONE]: 'minmax(0, 1fr)',
		},
	},
	column: {
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
		minWidth: 0,
		minHeight: '320px',
		paddingInline: '12px',
		paddingBottom: '18px',
		borderRightWidth: '1px',
		borderRightStyle: 'solid',
		borderRightColor: color['--line'],
		borderBottomWidth: { default: 0, [TWO]: '1px', [ONE]: '1px' },
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	// The reviewer's column stands on the palest petrol: where the work that waits on them is.
	columnYours: { backgroundColor: color['--wash-tint'] },
	head: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		height: '46px',
		flexShrink: 0,
	},
	count: { marginLeft: 'auto', fontSize: '12px', color: color['--ink'] },
	empty: {
		paddingBlock: '16px',
		paddingInline: '12px',
		textAlign: 'center',
		fontSize: '12px',
		color: color['--muted'],
		borderWidth: '1px',
		borderStyle: 'dashed',
		borderColor: color['--line-strong'],
	},
})
