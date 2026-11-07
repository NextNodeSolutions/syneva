import * as stylex from '@stylexjs/stylex'

import { deskText } from './desk.stylex'

export const treeHead = stylex.create({
	head: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: '28px',
		paddingInline: '8px 2px',
	},
	title: {
		margin: 0,
		fontSize: deskText.label,
	},
})
