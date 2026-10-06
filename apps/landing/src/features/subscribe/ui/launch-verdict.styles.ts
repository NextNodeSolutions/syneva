import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { sheet } from './signup.stylex'

export const launchVerdict = stylex.create({
	entry: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		minHeight: '24px',
	},
	value: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontSize: '15px',
		color: color['--ink'],
	},
	email: { fontFamily: font['--mono'], fontSize: '13.5px' },
	tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
	// Over the design system's caption: green, as the verdict's.
	caption: { flexShrink: 0, fontSize: '10.5px', color: color['--green'] },
	top: { paddingTop: '22px', paddingInline: sheet.inset },
	again: {
		marginTop: '6px',
		fontSize: '13px',
		color: color['--muted'],
	},
	day: {
		paddingTop: '18px',
		paddingBottom: '22px',
		paddingInline: sheet.inset,
	},
	heading: { fontSize: '24px' },
	lede: {
		fontSize: '15px',
		lineHeight: 1.55,
	},
})
