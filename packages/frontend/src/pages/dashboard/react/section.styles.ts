import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { pageInset } from './page.stylex'

// A settings-like page's sections: a heading and its note on the left, the section's content on
// the right, the pair under a hairline; one column on narrow pages.
const NARROW = '@container page (max-width: 760px)'

export const pageSection = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 260px) minmax(0, 1fr)',
			[NARROW]: 'minmax(0, 1fr)',
		},
		columnGap: '40px',
		rowGap: '14px',
		paddingBlock: '26px',
		marginInline: pageInset.gutter,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	heading: { fontSize: '15px', fontWeight: 500, letterSpacing: '-.01em' },
	note: {
		marginTop: '6px',
		fontSize: '12.5px',
		lineHeight: 1.55,
		color: color['--muted'],
	},
	content: {
		minWidth: 0,
		display: 'flex',
		flexDirection: 'column',
		gap: '14px',
	},
	facts: {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 160px) minmax(0, 1fr)',
		rowGap: '0',
	},
	// A fact's term and value sit in the list's grid as if the row were not there.
	factRow: { display: 'contents' },
	fact: {
		paddingBlock: '9px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: '13px',
	},
	factKey: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	factValue: {
		fontFamily: font['--mono'],
		fontSize: '12.5px',
		overflowWrap: 'anywhere',
	},
})
