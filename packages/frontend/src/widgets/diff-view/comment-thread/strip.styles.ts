import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The strip of threads that lost their line: amber, since an open thread
// blocks approval until it is resolved - its head in the caption voice, its
// threads ruled apart in the same amber.
export const strip = stylex.create({
	strip: {
		marginTop: '5px',
		marginBottom: '2px',
		paddingTop: '2px',
		paddingBottom: '4px',
		fontFamily: font['--sans'],
		backgroundColor: color['--amber-tint'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--amber-line'],
	},
	// Composed after caption.base + caption.upper.
	head: {
		paddingTop: '8px',
		paddingInline: '16px',
		paddingBottom: '2px',
		fontSize: deskText.label,
		color: color['--amber'],
	},
	rule: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--amber-line'],
	},
})
