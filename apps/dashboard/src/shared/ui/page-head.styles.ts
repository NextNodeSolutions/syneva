import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const pageHead = stylex.create({
	head: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		gap: '16px 24px',
		paddingBlock: '30px 20px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	text: {
		display: 'grid',
		gap: '8px',
		minWidth: 0,
	},
	headline: {
		margin: 0,
		fontSize: { default: '26px', [media.phone]: '23px' },
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1.12,
		textWrap: 'balance',
		overflowWrap: 'anywhere',
	},
	lede: {
		margin: 0,
		fontSize: '13.5px',
		color: color['--muted'],
	},
	aside: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
	},
})
