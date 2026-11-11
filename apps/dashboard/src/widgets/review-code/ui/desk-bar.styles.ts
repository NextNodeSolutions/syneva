import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

import { deskText } from './desk.stylex'

export const deskBar = stylex.create({
	bar: {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1fr) auto',
		alignItems: 'center',
		gap: '12px',
		minWidth: 0,
		paddingInline: '14px',
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		color: color['--muted'],
		fontSize: deskText.body,
	},
	identity: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		minWidth: 0,
	},
	treeToggle: {
		display: { default: 'none', [media.tablet]: 'inline-flex' },
		marginLeft: '-6px',
	},
	project: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		whiteSpace: 'nowrap',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		transition: `color ${transition.fast}`,
	},
	title: {
		minWidth: 0,
		margin: 0,
		paddingLeft: '10px',
		overflow: 'hidden',
		borderLeftWidth: '1px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--line'],
		fontSize: deskText.body,
		fontWeight: 500,
		color: color['--ink'],
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	facts: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
	},
	meta: {
		display: { default: 'inline', [media.tablet]: 'none' },
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		whiteSpace: 'nowrap',
	},
})
