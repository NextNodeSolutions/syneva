import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { menuSpacing } from './menu.stylex'

const INSET = menuSpacing.inset

export const panel = stylex.create({
	base: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 'min(var(--panel-width), var(--nav-available))',
		opacity: 'var(--opacity, 0)',
		transform: {
			default: 'translateX(calc(var(--offset, 0) * 1px))',
			[media.motionReduced]: 'none',
		},
		'--menu-title-line': 'calc(20 / 14)',
		pointerEvents: { default: 'none', ':not([inert])': 'auto' },
		// The open panel scrolls inside the shell when the viewport is short.
		maxHeight: {
			default: null,
			':not([inert])': 'var(--panel-max-height)',
		},
		overflowY: { default: null, ':not([inert])': 'auto' },
		overscrollBehavior: { default: null, ':not([inert])': 'contain' },
		zIndex: { default: null, ':not([inert])': 1 },
	},
	product: {
		'--panel-width': {
			default: '640px',
			[media.navToggle]: 'var(--nav-available)',
		},
	},
	workflows: {
		'--panel-width': {
			default: '540px',
			[media.navToggle]: 'var(--nav-available)',
		},
	},
	resources: {
		'--panel-width': {
			default: '340px',
			[media.navToggle]: 'var(--nav-available)',
		},
	},
	productBody: {
		display: 'grid',
		gridTemplateColumns: { default: '1fr 1fr', [media.navToggle]: '1fr' },
		padding: INSET,
		gap: INSET,
	},
	productLinks: {
		position: 'relative',
		isolation: 'isolate',
		'::before': {
			content: "''",
			position: 'absolute',
			inset: '0 0 auto',
			height: 'calc(var(--selection-height) * 1px)',
			backgroundColor: color['--paper'],
			borderRadius: '5px',
			transform: 'translateY(calc(var(--selection-y, 0) * 1px))',
			zIndex: -1,
			pointerEvents: 'none',
		},
	},
	resourceLinks: { padding: INSET },
	workflowLinks: {
		display: 'grid',
		gridTemplateColumns: { default: '1fr 1fr', [media.navToggle]: '1fr' },
		padding: INSET,
		columnGap: INSET,
	},
})
