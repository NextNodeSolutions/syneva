import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Plain prose: a heading column and a body column, ruled from the section
// above, stacking on narrow screens. A paragraph that follows something in
// the body keeps its distance.
export const prose = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1.45fr)',
			[media.narrow]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.narrow]: '28px' },
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	title: { fontSize: 'clamp(30px, 3.4vw, 44px)' },
	text: {
		maxWidth: '620px',
		marginTop: { default: null, ':not(:first-child)': '18px' },
	},
	// A block of a prose body (a callout, a list, a table, a terminal) keeps
	// its distance from what precedes it.
	block: { marginTop: { default: null, ':not(:first-child)': '32px' } },
})
