import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The cockpit: the hub's numbers over the same ledger. Four ruled tiles, then two figures (the
// rounds of the last two weeks, this week's verdicts), each in a white cell parted by
// hairlines. Narrow, the tiles take two rows and the figures stack.
// Exclusive ranges: StyleX does not order overlapping container queries.
const TWO = '@container cockpit (min-width: 521px) and (max-width: 900px)'
const ONE = '@container cockpit (max-width: 520px)'

export const cockpit = stylex.create({
	root: { containerType: 'inline-size', containerName: 'cockpit' },
	tiles: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, minmax(0, 1fr))',
			[TWO]: 'repeat(2, minmax(0, 1fr))',
			[ONE]: 'repeat(2, minmax(0, 1fr))',
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	tile: {
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
		minWidth: 0,
		paddingBlock: '18px',
		paddingInline: '20px',
		backgroundColor: color['--white'],
		boxShadow: `inset -1px -1px 0 ${color['--line']}`,
	},
	// The reviewer's own count: its tile is the one with a petrol rule on top.
	tileYours: {
		boxShadow: `inset 0 2px 0 ${color['--accent']}, inset -1px -1px 0 ${color['--line']}`,
	},
	figure: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '4px',
		fontSize: { default: '34px', [ONE]: '28px' },
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1,
		fontVariantNumeric: 'tabular-nums',
	},
	unit: {
		fontSize: '15px',
		fontWeight: 400,
		letterSpacing: 0,
		color: color['--muted'],
	},
	figureNone: {
		fontSize: '15px',
		fontWeight: 400,
		letterSpacing: 0,
		color: color['--muted'],
	},
	sub: { fontSize: '12px', color: color['--muted'] },
	figures: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 2fr) minmax(0, 1fr)',
			[TWO]: 'minmax(0, 1fr)',
			[ONE]: 'minmax(0, 1fr)',
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	cell: {
		minWidth: 0,
		paddingTop: '18px',
		paddingBottom: '16px',
		paddingInline: '20px',
		backgroundColor: color['--white'],
		boxShadow: `inset -1px -1px 0 ${color['--line']}`,
	},
	cellHead: {
		display: 'flex',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: '12px',
	},
	cellNote: { fontSize: '12px', color: color['--muted'] },
})
