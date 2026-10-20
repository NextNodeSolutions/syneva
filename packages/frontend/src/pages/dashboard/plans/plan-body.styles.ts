import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { pageInset } from '../react/page.stylex'

import { planFrame } from './plan-frame.stylex'

// The body of an RFC page: each section a band ruled under, its content in the page's centred
// frame, opened by a mono eyebrow and a headline; prose and figures take the frame's width.
export const planBody = stylex.create({
	root: { minWidth: 0 },
	band: {
		paddingTop: '52px',
		paddingBottom: '56px',
		paddingInline: pageInset.gutter,
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		scrollMarginTop: '8px',
	},
	inner: { maxWidth: planFrame.width, marginInline: 'auto' },
	eyebrow: {
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		fontWeight: 500,
		letterSpacing: '.08em',
		color: color['--accent'],
	},
	heading: {
		marginTop: '8px',
		maxWidth: '24em',
		fontSize: 'clamp(25px, 2.8vw, 34px)',
		fontWeight: 500,
		letterSpacing: '-.035em',
		lineHeight: 1.15,
		textWrap: 'balance',
	},
})
