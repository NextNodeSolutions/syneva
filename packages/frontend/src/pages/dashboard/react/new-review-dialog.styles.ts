import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The New review sheet's body: a dialog-scale heading, the intro, the fields a step apart.
// The form between the dialog and its body/footer is a flex column with no minimum height,
// so the body scrolls when the sheet outgrows the screen.
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
	// A refusal's file list under its sentence: mono, one file per line, the status letters in
	// one column and the paths in the next (refusal-reason.tsx pads them).
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
	// Cancel's inset widens the press area around its label and holds it off the primary.
	cancel: { paddingInline: '12px' },
	// Scrolled into view with room under it, clear of the footer's rule.
	refusal: {
		marginTop: '4px',
		marginBottom: '16px',
		scrollMarginBottom: '24px',
	},
})
