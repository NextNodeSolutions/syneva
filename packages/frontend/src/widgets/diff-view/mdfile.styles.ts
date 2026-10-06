import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const mdFile = stylex.create({
	document: {
		maxWidth: '760px',
		marginInline: 'auto',
		padding: '28px 32px 64px',
	},
	anchor: {
		cursor: 'pointer',
		transition: 'background-color .1s, box-shadow .1s',
		backgroundColor: { default: null, ':hover': color['--wash-tint'] },
		boxShadow: {
			default: null,
			':hover': `0 0 0 4px ${color['--wash-tint']}`,
		},
	},
	thread: {
		marginTop: '6px',
		marginBottom: '14px',
		backgroundColor: color['--white'],
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--accent-line'],
		cursor: 'default',
	},
	threadInItem: { marginLeft: '-6px' },
})
