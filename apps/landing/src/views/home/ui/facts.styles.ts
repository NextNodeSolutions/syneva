import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Trust register: product facts, styled as a ruled register.
export const facts = stylex.create({
	head: {
		display: 'grid',
		gridTemplateColumns: { default: '1.25fr 1fr', [media.narrow]: '1fr' },
		gap: { default: '70px', [media.narrow]: '24px' },
		marginBottom: { default: '64px', [media.narrow]: '44px' },
	},
	headText: { alignSelf: 'end', maxWidth: '430px' },
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
