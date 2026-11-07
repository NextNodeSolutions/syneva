import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const LINE = color['--line']

export const kbdGrid = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(2, 1fr)',
			[media.phone]: '1fr',
		},
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line-strong'],
		marginTop: { default: null, ':not(:first-child)': '32px' },
	},
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '14px',
		padding: '13px 0',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: LINE,
		fontSize: '14px',
		paddingRight: {
			default: null,
			':nth-child(odd)': '24px',
			[media.phone]: { default: null, ':nth-child(odd)': 0 },
		},
		paddingLeft: {
			default: null,
			':nth-child(even)': '24px',
			[media.phone]: { default: null, ':nth-child(even)': 0 },
		},
		borderLeftWidth: {
			default: null,
			':nth-child(even)': '1px',
			[media.phone]: { default: null, ':nth-child(even)': 0 },
		},
		borderLeftStyle: {
			default: null,
			':nth-child(even)': 'solid',
			[media.phone]: { default: null, ':nth-child(even)': 'none' },
		},
		borderLeftColor: {
			default: null,
			':nth-child(even)': LINE,
			[media.phone]: {
				default: null,
				':nth-child(even)': 'currentcolor',
			},
		},
	},
	key: {
		display: 'inline-grid',
		placeItems: 'center',
		minWidth: '30px',
		height: '28px',
		padding: '0 7px',
		font: `12.5px ${font['--sans']}`,
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		borderBottomWidth: '2px',
		backgroundColor: color['--white'],
		color: color['--ink'],
	},
	label: { color: color['--muted'] },
})
