import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const newReviewDialog = stylex.create({
	form: { display: 'flex', flexDirection: 'column', minHeight: 0 },
	title: {
		fontSize: { default: '28px', [media.phone]: '26px' },
		fontWeight: 500,
		letterSpacing: '-.035em',
		lineHeight: 1.1,
	},
	intro: {
		maxWidth: '46ch',
		marginTop: '10px',
		fontSize: '14px',
		lineHeight: 1.55,
		color: color['--muted'],
	},
	fields: {
		display: 'grid',
		rowGap: '20px',
		marginTop: '24px',
		paddingBottom: '16px',
	},
	files: {
		display: 'block',
		marginTop: '6px',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		lineHeight: 1.5,
		whiteSpace: 'pre-wrap',
		overflowWrap: 'anywhere',
		textWrap: 'wrap',
	},
	cancel: { paddingInline: '12px' },
	refusal: {
		marginTop: '4px',
		marginBottom: '16px',
		scrollMarginBottom: '24px',
	},
})
