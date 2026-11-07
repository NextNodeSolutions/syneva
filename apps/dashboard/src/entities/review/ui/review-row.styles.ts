import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const reviewRow = stylex.create({
	row: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) auto',
			[media.phone]: 'minmax(0, 1fr)',
		},
		alignItems: 'baseline',
		gap: '6px 16px',
		paddingBlock: '14px',
		paddingInline: '16px',
		backgroundColor: {
			default: color['--white'],
			':hover': color['--field'],
		},
		transition: `background-color ${transition.fast}`,
	},
	title: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '8px',
		minWidth: 0,
		fontSize: '15px',
		fontWeight: 500,
		letterSpacing: '-.01em',
		overflowWrap: 'anywhere',
	},
	meta: {
		minWidth: 0,
		overflowWrap: 'anywhere',
	},
})
