import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

export const resizer = stylex.create({
	rule: {
		position: 'relative',
		minWidth: '1px',
		cursor: 'col-resize',
		backgroundColor: {
			default: color['--line'],
			':hover': color['--accent'],
		},
		transition: `background-color ${duration['--duration-fast']} ${ease['--ease-out']}`,
		display: { default: null, [media.tablet]: 'none' },
		'::before': {
			content: '""',
			position: 'absolute',
			insetBlock: 0,
			insetInline: '-4px',
		},
	},
	dragging: { backgroundColor: color['--accent'] },
	hidden: { display: 'none' },
})
