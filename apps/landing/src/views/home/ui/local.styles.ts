import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const local = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.tablet]: '48px' },
		alignItems: 'center',
	},
	text: { maxWidth: '500px', marginTop: '24px' },
	points: {
		listStyle: 'none',
		padding: 0,
		margin: '28px 0 0',
		display: 'grid',
		gap: '10px',
		fontSize: '14px',
	},
	point: {
		paddingLeft: '24px',
		position: 'relative',
		'::before': {
			content: "''",
			position: 'absolute',
			left: 0,
			top: '6px',
			width: '11px',
			height: '11px',
			borderWidth: '1px',
			borderStyle: 'solid',
			borderColor: color['--green'],
			backgroundColor: color['--mint'],
		},
	},
	code: { fontSize: '12.5px' },
	note: { fontSize: '12px' },
})
