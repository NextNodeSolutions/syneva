import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The availability line under the title: a square dot and the words.
export const pageStatus = stylex.create({
	root: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '8px',
		marginTop: '22px',
		font: `11px/1.4 ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '10px' },
		color: color['--muted'],
		padding: '6px 11px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		backgroundColor: color['--white'],
		letterSpacing: '0.03em',
	},
	prototype: { color: color['--accent'] },
	dot: { width: '7px', height: '7px', backgroundColor: 'currentColor' },
})
