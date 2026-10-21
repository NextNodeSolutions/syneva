import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { pageInset } from '../react/page.stylex'

// A plan read like the RFCs it is modelled on: a mono eyebrow, the title as a headline, its
// summary as the lede and its sections as a table of contents, its versions beside them; then
// the body in bands (plan-body.styles.ts). The head is a band too (plan-band.styles.ts), with
// its own spacing and its frame in two columns. On a narrow page the versions follow the head.
const NARROW = '@container page (max-width: 980px)'

export const planPage = stylex.create({
	hero: { paddingTop: '56px', paddingBottom: '40px' },
	heroFrame: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) 240px',
			[NARROW]: 'minmax(0, 1fr)',
		},
		gap: '36px 64px',
		alignItems: 'start',
	},
	heroMain: { minWidth: 0 },
	heroMeta: { display: 'grid', gap: '24px', minWidth: 0 },
	eyebrow: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '6px 14px',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		fontWeight: 500,
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	crumb: {
		color: color['--accent'],
		textDecoration: 'none',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--accent-line'],
	},
	title: {
		marginTop: '14px',
		maxWidth: '16em',
		fontSize: 'clamp(34px, 4.4vw, 54px)',
		fontWeight: 500,
		letterSpacing: '-.04em',
		lineHeight: 1.05,
		textWrap: 'balance',
	},
	lede: {
		marginTop: '18px',
		maxWidth: '72ch',
		fontSize: '16.5px',
		lineHeight: 1.6,
		color: color['--muted'],
		textWrap: 'pretty',
	},
	toc: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '8px 20px',
		marginTop: '28px',
		fontFamily: font['--mono'],
		fontSize: '12.5px',
	},
	tocLink: {
		color: { default: color['--muted'], ':hover': color['--accent'] },
		textDecoration: 'none',
		paddingBottom: '1px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
	},
	tocNumber: { marginRight: '8px', color: color['--accent'] },
	actions: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '8px',
		marginTop: '26px',
	},
	failure: { fontSize: '13px', color: color['--red'] },
	notice: { marginBottom: '28px' },
	empty: {
		paddingTop: '44px',
		paddingInline: pageInset.gutter,
		fontSize: '14px',
		color: color['--muted'],
	},
})
