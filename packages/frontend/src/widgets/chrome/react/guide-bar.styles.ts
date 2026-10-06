import { deskSize, deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const guideBar = stylex.create({
	bar: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		height: deskSize.subbar,
		paddingInline: '12px',
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: deskText.body,
	},
	acts: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
	},
	trigger: { position: 'relative' },
	stale: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		fontSize: deskText.small,
		color: color['--amber'],
	},
})
