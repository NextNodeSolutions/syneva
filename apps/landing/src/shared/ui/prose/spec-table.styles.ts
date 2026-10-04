import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// Key/value rows in mono, for flags, events and fields.
export const specTable = stylex.create({
	root: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line-strong'],
		fontSize: '14px',
	},
	row: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 2fr) minmax(0, 3fr)',
			[media.phone]: '1fr',
		},
		gap: { default: '24px', [media.phone]: '4px' },
		padding: '13px 0',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		alignItems: 'baseline',
	},
	head: {
		font: `11px ${font['--mono']}`,
		letterSpacing: '.05em',
		textTransform: 'uppercase',
		color: color['--muted'],
		paddingBlock: '10px',
	},
	value: { color: color['--muted'] },
	key: {
		justifySelf: 'start',
		backgroundColor: 'transparent',
		padding: 0,
		color: color['--accent'],
		fontSize: '13px',
		overflowWrap: 'anywhere',
	},
})
