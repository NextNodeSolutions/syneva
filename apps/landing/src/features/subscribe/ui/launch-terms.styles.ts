import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const launchTerms = stylex.create({
	// The sheet's last lines, under the form and under the verdict alike.
	list: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '4px 16px',
		marginBlock: 0,
		paddingTop: 0,
		paddingBottom: '18px',
		paddingInline: { default: '20px', [media.phone]: '14px' },
		listStyle: 'none',
		font: `11px/1.6 ${font['--mono']}`,
		letterSpacing: '.02em',
		color: color['--muted'],
	},
	term: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
	square: {
		width: '5px',
		height: '5px',
		backgroundColor: color['--accent-line'],
	},
})
