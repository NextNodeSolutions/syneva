import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

const DRAWER_LAYER = 2
const VEIL_LAYER = 1

export const treePanel = stylex.create({
	panel: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
		minHeight: 0,
		padding: '8px',
		overflowY: 'auto',
		backgroundColor: color['--paper'],
		position: { default: 'static', [media.tablet]: 'absolute' },
		insetBlock: 0,
		left: 0,
		zIndex: { default: 'auto', [media.tablet]: DRAWER_LAYER },
		width: { default: 'auto', [media.tablet]: 'min(86vw, 300px)' },
		borderRightWidth: { default: 0, [media.tablet]: '1px' },
		borderRightStyle: 'solid',
		borderRightColor: color['--line-strong'],
		transform: { default: 'none', [media.tablet]: 'translateX(-100%)' },
		visibility: { default: 'visible', [media.tablet]: 'hidden' },
		transition: `transform ${transition.fast}, visibility ${transition.fast}`,
	},
	open: {
		transform: 'none',
		visibility: 'visible',
	},
	veil: {
		display: { default: 'none', [media.tablet]: 'block' },
		position: 'absolute',
		inset: 0,
		zIndex: VEIL_LAYER,
		padding: 0,
		borderWidth: 0,
		backgroundColor: `color-mix(in srgb, ${color['--paper']} 70%, transparent)`,
	},
})
