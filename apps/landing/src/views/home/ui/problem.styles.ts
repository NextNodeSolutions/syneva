import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The problem: its copy paired with the gap chart.
export const problem = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1.12fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.tablet]: '48px' },
		alignItems: 'center',
	},
	text: { marginTop: '22px', maxWidth: '470px' },
	figure: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--field'],
		minWidth: 0,
	},
	caption: {
		font: `11px ${font['--mono']}`,
		color: color['--muted'],
		padding: '13px 20px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
})
