import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The filters in force as a row of petrol chips under the head, each closing itself.
export const chips = stylex.create({
	bar: {
		display: 'flex',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '8px',
		paddingBlock: '10px',
		paddingInline: { default: '32px', [media.stacked]: '16px' },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	chip: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		minHeight: '26px',
		paddingInline: '8px',
		fontFamily: 'inherit',
		fontSize: '12px',
		color: color['--accent'],
		backgroundColor: {
			default: color['--wash'],
			':hover': color['--white'],
		},
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--accent-line'],
		cursor: 'pointer',
	},
	kind: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
	},
	cross: { width: '12px', height: '12px' },
	clear: {
		fontFamily: 'inherit',
		fontSize: '12px',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		backgroundColor: 'transparent',
		borderWidth: 0,
		textDecoration: 'underline',
		textUnderlineOffset: '3px',
		cursor: 'pointer',
	},
})
