import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Locality: the copy paired with the machine drawing, then the trust register
// (product facts) on one ruled row under both.
export const local = stylex.create({
	lead: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.tablet]: '48px' },
		alignItems: 'center',
	},
	text: { maxWidth: '500px', marginTop: '24px' },
	stats: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, 1fr)',
			[media.narrow]: 'repeat(2, 1fr)',
		},
		columnGap: { default: '32px', [media.phone]: '18px' },
		rowGap: {
			default: '32px',
			[media.narrow]: '40px',
			[media.phone]: '28px',
		},
		marginTop: { default: '72px', [media.narrow]: '56px' },
	},
	stat: { paddingTop: '22px' },
	number: {
		display: 'block',
		fontSize: 'clamp(46px, 5.4vw, 78px)',
		fontWeight: 500,
		letterSpacing: '-.045em',
		lineHeight: 1,
		fontVariantNumeric: 'tabular-nums',
	},
	first: { color: color['--accent'] },
	unit: { fontSize: '.55em', letterSpacing: 0 },
	label: {
		display: 'block',
		marginTop: '13px',
		color: color['--muted'],
		fontSize: { default: '14px', [media.phone]: '13px' },
		lineHeight: 1.55,
		maxWidth: '26ch',
	},
})
