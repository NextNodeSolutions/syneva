import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const fileNote = stylex.create({
	wrap: { padding: '12px' },
	strip: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		width: '100%',
		paddingBlock: '10px',
		paddingInline: '12px',
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		color: color['--muted'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		cursor: 'default',
	},
	stale: {
		color: color['--amber'],
		backgroundColor: color['--amber-tint'],
		borderColor: color['--amber-line'],
	},
	icon: { color: color['--amber'] },
	name: {
		fontFamily: font['--mono'],
		color: color['--ink'],
	},
	meta: {
		flexGrow: 1,
		textAlign: 'right',
	},
})
