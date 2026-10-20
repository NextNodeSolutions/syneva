import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { pageInset } from '../react/page.stylex'

// A plan read like the RFCs it is modelled on: a mono eyebrow, the title as a headline, its
// summary as the lede and its sections as a table of contents; then the body beside its
// versions. On a narrow page the versions follow the body.
const NARROW = '@container page (max-width: 980px)'

export const planPage = stylex.create({
	hero: {
		paddingTop: '44px',
		paddingBottom: '30px',
		paddingInline: pageInset.gutter,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
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
		maxWidth: '18em',
		fontSize: 'clamp(30px, 4vw, 46px)',
		fontWeight: 500,
		letterSpacing: '-.04em',
		lineHeight: 1.06,
		textWrap: 'balance',
	},
	lede: {
		marginTop: '16px',
		maxWidth: '62ch',
		fontSize: '16.5px',
		lineHeight: 1.6,
		color: color['--muted'],
		textWrap: 'pretty',
	},
	toc: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '8px 20px',
		marginTop: '24px',
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
	actions: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '8px',
		marginTop: '26px',
	},
	failure: { fontSize: '13px', color: color['--red'] },
	layout: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) 240px',
			[NARROW]: 'minmax(0, 1fr)',
		},
		gap: '28px 56px',
		alignItems: 'start',
		paddingTop: '36px',
		paddingBottom: '64px',
		paddingInline: pageInset.gutter,
	},
	article: { minWidth: 0 },
	notice: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'baseline',
		gap: '6px 14px',
		marginBottom: '28px',
		paddingBlock: '12px',
		paddingInline: '16px',
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--amber'],
		backgroundColor: color['--amber-tint'],
		fontSize: '13.5px',
	},
	aside: {
		position: { default: 'sticky', [NARROW]: 'static' },
		top: '24px',
		display: 'grid',
		gap: '28px',
	},
	empty: {
		paddingTop: '44px',
		paddingInline: pageInset.gutter,
		fontSize: '14px',
		color: color['--muted'],
	},
})
