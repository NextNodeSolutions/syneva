import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const launchForm = stylex.create({
	form: { position: 'relative', marginBlock: 0 },
	foot: {
		paddingTop: '20px',
		paddingBottom: '6px',
		paddingInline: { default: '20px', [media.phone]: '14px' },
	},
	send: {
		width: '100%',
		minHeight: '52px',
		paddingInline: { default: '22px', [media.phone]: '16px' },
		fontSize: '15px',
	},
	// One line held open, so a refusal never shifts the terms under it.
	status: {
		minHeight: '1.6em',
		marginTop: '10px',
		font: `11.5px/1.6 ${font['--mono']}`,
		color: color['--muted'],
	},
	statusRefused: { color: color['--red'] },
})
