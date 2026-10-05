import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

import { deskGrid } from './desk-row.stylex'

// Hidden for the animation's whole run, then shown: the loading line waits out a quick hub.
// With motion reduced the shell drops the animation and the line shows at once.
const holdBack = stylex.keyframes({
	from: { visibility: 'hidden' },
	to: { visibility: 'hidden' },
})

// The site's head row at app scale, laid on the listing's own tracks: the statement and its
// lede over the rows' icon, desk and stage columns, the register bottom-aligned over their
// review, actions and arrow (over the stage and arrow from tablets down), so its rule starts
// where the review column does; one column from 900px down. The whole band is closed by a
// hairline. Its minimum height is the statement's, so the page does not jump when the first
// listing lands.
export const hubHead = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: {
			default: deskGrid.wide,
			[media.tablet]: deskGrid.tablet,
			[media.narrow]: 'minmax(0, 1fr)',
		},
		columnGap: deskGrid.gap,
		rowGap: { default: 0, [media.narrow]: '36px', [media.phone]: '28px' },
		alignItems: 'end',
		minHeight: { default: '172px', [media.phone]: '112px' },
		paddingTop: {
			default: '52px',
			[media.narrow]: '40px',
			[media.phone]: '32px',
		},
		paddingBottom: {
			default: '44px',
			[media.narrow]: '36px',
			[media.phone]: '30px',
		},
		paddingLeft: layout['--gutter'],
		// The rows' end inset too, so the register ends where the arrows do.
		paddingRight: `calc(${layout['--gutter']} + ${deskGrid.endInset})`,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	// Alone on the page (no listing under it), the head is its one hero: no rule parts it from
	// the paper below.
	alone: { borderBottomStyle: 'none' },
	statement: {
		gridColumn: {
			default: '1 / 4',
			[media.tablet]: '1 / 3',
			[media.narrow]: 'auto',
		},
	},
	register: {
		gridColumn: {
			default: '4 / -1',
			[media.tablet]: '3 / -1',
			[media.narrow]: 'auto',
		},
	},
	title: {
		maxWidth: '12em',
		fontSize: {
			default: 'clamp(36px, 4.2vw, 52px)',
			[media.phone]: '34px',
		},
		fontWeight: 500,
		letterSpacing: '-.04em',
		lineHeight: 1.07,
		textWrap: 'balance',
		color: color['--ink'],
	},
	pending: {
		color: color['--muted'],
		animationName: holdBack,
		animationDuration: '300ms',
	},
	lede: {
		maxWidth: '440px',
		marginTop: '18px',
		fontSize: { default: '15.5px', [media.phone]: '15px' },
		lineHeight: 1.6,
		color: color['--muted'],
		textWrap: 'pretty',
	},
	action: { marginTop: '24px' },
})
