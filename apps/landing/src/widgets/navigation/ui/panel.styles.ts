import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { menuElevation, menuSpacing } from './menu.stylex'
import { navBounds } from './nav.stylex'

const INSET = menuSpacing.inset

export const panel = stylex.create({
	base: {
		position: 'absolute',
		top: 0,
		// On phones the panel holds to the top-right corner the dropdown unfolds from, so the shell uncovers it in place instead of dragging it along.
		left: { default: 0, [media.navToggle]: 'auto' },
		right: { default: null, [media.navToggle]: 0 },
		width: `min(var(--panel-width), ${navBounds['--nav-available']})`,
		opacity: 'var(--opacity, 0)',
		transform: {
			default: 'translateX(calc(var(--offset, 0) * 1px))',
			[media.motionReduced]: 'none',
		},
		'--menu-title-line': 'calc(20 / 14)',
		pointerEvents: { default: 'none', ':not([inert])': 'auto' },
		maxHeight: {
			default: null,
			':not([inert])': navBounds['--panel-max-height'],
		},
		overflowY: { default: null, ':not([inert])': 'auto' },
		overscrollBehavior: { default: null, ':not([inert])': 'contain' },
		zIndex: { default: null, ':not([inert])': 1 },
	},
	product: {
		'--panel-width': {
			default: '640px',
			[media.navToggle]: navBounds['--nav-available'],
		},
	},
	workflows: {
		'--panel-width': {
			default: '540px',
			[media.navToggle]: navBounds['--nav-available'],
		},
	},
	resources: {
		'--panel-width': {
			default: '340px',
			[media.navToggle]: navBounds['--nav-available'],
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
			backgroundColor: color['--white'],
			boxShadow: menuElevation.raised,
			borderRadius: '5px',
			transform: 'translateY(calc(var(--selection-y, 0) * 1px))',
			zIndex: -1,
			pointerEvents: 'none',
		},
	},
	resourceLinks: { padding: INSET },
	// WorkflowLink.astro rules its cells by this column count (COLUMNS).
	workflowLinks: {
		display: 'grid',
		gridTemplateColumns: { default: '1fr 1fr', [media.navToggle]: '1fr' },
		padding: INSET,
		columnGap: INSET,
	},
})
