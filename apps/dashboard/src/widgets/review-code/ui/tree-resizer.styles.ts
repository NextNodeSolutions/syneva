import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

const HANDLE_LAYER = 1

export const treeResizer = stylex.create({
	handle: {
		display: { default: 'block', [media.tablet]: 'none' },
		position: 'relative',
		zIndex: HANDLE_LAYER,
		cursor: 'col-resize',
		touchAction: 'none',
		backgroundColor: {
			default: color['--line'],
			':hover': color['--accent'],
			':focus-visible': color['--accent'],
		},
		transition: `background-color ${transition.fast}`,
		// A one-pixel rule is too thin to grab, so the hit area reaches past it on both sides.
		'::after': {
			content: '""',
			position: 'absolute',
			insetBlock: 0,
			insetInline: '-4px',
		},
	},
	dragging: {
		backgroundColor: color['--accent'],
	},
})
