import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const guidePending = stylex.create({
	note: {
		marginBlock: '8px',
		marginInline: '12px',
		paddingBlock: '8px',
		paddingInline: '10px',
		backgroundColor: color['--amber-tint'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--amber-line'],
		fontSize: deskText.small,
		lineHeight: 1.45,
		color: color['--amber'],
	},
	code: { fontFamily: font['--mono'] },
})
