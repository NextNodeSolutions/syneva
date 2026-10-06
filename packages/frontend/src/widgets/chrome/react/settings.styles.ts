import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const settings = stylex.create({
	tabs: {
		height: '40px',
		marginInline: '-20px',
		marginBottom: '6px',
		paddingInline: '14px',
	},
	section: {
		marginTop: { default: '22px', ':first-child': '10px' },
		marginBottom: '2px',
		paddingBottom: '8px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	row: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		minHeight: '42px',
		paddingBlock: '5px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: deskText.body,
		color: color['--ink'],
		whiteSpace: 'nowrap',
	},
	control: {
		width: '210px',
		minHeight: '30px',
		paddingBlock: '5px',
		paddingInline: '9px',
		fontSize: deskText.body,
	},
	select: { paddingRight: '30px' },
	chevron: { right: '10px' },
	number: { width: '90px', fontFamily: font['--mono'] },
	text: { fontFamily: font['--mono'] },
	box: { flexShrink: 0 },
	keys: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		columnGap: '28px',
		rowGap: '6px',
		marginTop: '8px',
	},
	group: { breakInside: 'avoid', marginBottom: '8px' },
	groupHead: {
		marginBlock: '10px 6px',
		paddingBottom: '6px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	key: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		paddingBlock: '3px',
		fontSize: deskText.body,
		color: color['--ink'],
	},
})
