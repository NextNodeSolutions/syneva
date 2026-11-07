import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

export const fileHeader = stylex.create({
	bar: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		minWidth: 0,
		paddingBlock: '8px',
		paddingInline: '16px',
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	path: {
		minWidth: 0,
		margin: 0,
		overflow: 'hidden',
		fontFamily: font['--mono'],
		fontSize: deskText.title,
		fontWeight: 600,
		color: color['--ink'],
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	moved: {
		flexShrink: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--amber'],
		whiteSpace: 'nowrap',
	},
	churn: {
		flexShrink: 0,
		marginLeft: 'auto',
	},
})
