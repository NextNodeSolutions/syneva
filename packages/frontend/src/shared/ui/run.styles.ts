import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

const SEPARATOR_WIDTH = '3ch'

export const run = stylex.create({
	clip: { overflow: 'hidden' },
	parts: {
		display: 'flex',
		flexWrap: 'wrap',
		marginLeft: `calc(-1 * ${SEPARATOR_WIDTH})`,
	},
	part: {
		position: 'relative',
		minWidth: 0,
		paddingLeft: SEPARATOR_WIDTH,
		overflowWrap: 'anywhere',
		'::before': {
			content: '"·"',
			position: 'absolute',
			left: 0,
			width: SEPARATOR_WIDTH,
			textAlign: 'center',
			color: color['--muted'],
		},
	},
})
