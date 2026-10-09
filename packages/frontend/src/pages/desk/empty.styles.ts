import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const empty = stylex.create({
	page: {
		minHeight: '100%',
		display: 'grid',
		alignItems: 'safe center',
		justifyItems: 'center',
		paddingBlock: '48px',
		paddingInline: '30px',
		backgroundColor: color['--paper'],
		backgroundImage: `linear-gradient(${color['--grid']} 1px, transparent 1px), linear-gradient(90deg, ${color['--grid']} 1px, transparent 1px)`,
		backgroundSize: '48px 48px',
		backgroundPosition: '-1px -1px',
	},
	card: {
		maxWidth: '54ch',
		paddingBlock: '22px',
		paddingInline: '26px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		fontSize: deskText.title,
		lineHeight: 1.6,
		color: color['--muted'],
	},
	title: {
		margin: '0 0 8px',
		fontSize: '22px',
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1.15,
		color: color['--ink'],
	},
	note: { marginBlock: 0, textWrap: 'balance' },
})
