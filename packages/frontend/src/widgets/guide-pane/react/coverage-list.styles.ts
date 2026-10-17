import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const coverage = stylex.create({
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		width: '100%',
		paddingBlock: '5px',
		paddingInline: '8px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: { default: 'transparent', ':hover': color['--line'] },
		backgroundColor: {
			default: 'transparent',
			':hover': color['--white'],
		},
		textAlign: 'left',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		color: color['--ink'],
		cursor: 'pointer',
	},
	// One file of the domain: its row, then its spans when it owns more than one block.
	file: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
	},
	current: {
		borderColor: color['--accent-line'],
		backgroundColor: color['--wash'],
	},
	// A brick's row sits one step in from its file's, under the path's name.
	brick: {
		display: 'flex',
		paddingBlock: '3px',
		paddingLeft: '22px',
	},
	kind: {
		flexShrink: 0,
		fontSize: '10px',
		letterSpacing: '.04em',
		color: color['--muted'],
	},
	brickName: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	path: {
		display: 'flex',
		minWidth: 0,
		whiteSpace: 'nowrap',
	},
	dir: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		color: color['--muted'],
	},
	name: { flexShrink: 0 },
	lines: { color: color['--muted'], whiteSpace: 'nowrap' },
	verdict: { marginLeft: 'auto' },
})
