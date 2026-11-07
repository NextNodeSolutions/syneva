import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const fileIndex = stylex.create({
	index: {
		position: { default: 'sticky', [media.tablet]: 'static' },
		top: 0,
		maxHeight: { default: '100dvh', [media.tablet]: 'none' },
		overflowY: 'auto',
		paddingBlock: '4px 16px',
	},
	label: {
		margin: 0,
		paddingBottom: '8px',
	},
	list: {
		margin: 0,
		padding: 0,
		listStyle: 'none',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		backgroundColor: color['--white'],
	},
	entry: {
		display: 'grid',
		gridTemplateColumns: '12px minmax(0, 1fr) auto',
		alignItems: 'baseline',
		gap: '8px',
		paddingBlock: '6px',
		paddingInline: '10px',
		fontFamily: font['--mono'],
		fontSize: '12px',
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
	},
	mark: {
		fontWeight: 600,
	},
	added: { color: color['--green'] },
	modified: { color: color['--accent'] },
	deleted: { color: color['--red'] },
	renamed: { color: color['--muted'] },
	path: {
		minWidth: 0,
		overflowWrap: 'anywhere',
	},
	directory: {
		color: color['--muted'],
	},
})
