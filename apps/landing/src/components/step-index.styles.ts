import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The mono step number above a ruled item (01, 02, ...).
export const stepIndex = stylex.create({
	base: {
		display: 'block',
		font: `12px ${font['--mono']}`,
		letterSpacing: '.035em',
		color: color['--accent'],
		marginBottom: '15px',
	},
})
