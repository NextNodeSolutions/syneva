import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const awaiting = stylex.create({
	line: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		marginTop: '6px',
		fontSize: deskText.small,
		color: color['--accent'],
	},
	queued: { color: color['--amber'] },
	activity: { minWidth: 0, color: color['--ink'] },
})
