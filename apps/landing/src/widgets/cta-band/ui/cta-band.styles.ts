import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

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
	// The commands sit on the wash: paper ground, petrol rule.
	command: {
		borderColor: {
			default: color['--accent-line'],
			':has(.is-copied)': color['--green'],
		},
		backgroundColor: color['--paper'],
	},
})
