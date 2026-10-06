import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const fileComments = stylex.create({
	section: {
		marginTop: '5px',
		marginBottom: '2px',
		paddingTop: '2px',
		paddingBottom: '4px',
		fontFamily: font['--sans'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
	},
	onCard: { marginTop: '10px' },
	inDocument: { marginTop: 0, marginBottom: '20px' },
	rule: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	bar: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		padding: '6px 10px 4px',
	},
	label: {
		fontSize: deskText.small,
		color: color['--muted'],
	},
	tile: {
		width: '24px',
		minHeight: '24px',
		paddingBlock: 0,
		paddingInline: 0,
	},
})
