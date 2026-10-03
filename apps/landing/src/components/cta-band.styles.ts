import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/tokens/media.stylex'
import { color, font } from '@syneva/tokens/tokens.stylex'

// The start band: the install call to action closing every page.
export const band = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1.15fr 1fr',
			[media.stacked]: 'minmax(0, 1fr)',
		},
		gap: { default: '64px', [media.narrow]: '40px', [media.stacked]: 0 },
		backgroundColor: color['--wash'],
		scrollMarginTop: '24px',
	},
	title: {
		fontSize: {
			default: 'clamp(32px, 3.7vw, 46px)',
			[media.phone]: '34px',
		},
	},
	text: {
		margin: '22px 0 26px',
		maxWidth: '420px',
		color: color['--wash-ink'],
	},
	links: { display: 'flex', flexWrap: 'wrap', gap: '14px 28px' },
	install: {
		alignSelf: 'center',
		minWidth: 0,
		marginTop: { default: null, [media.stacked]: '40px' },
	},
	label: {
		font: `11px ${font['--mono']}`,
		color: color['--wash-ink'],
		marginBottom: '10px',
	},
	next: { marginTop: '30px' },
})
