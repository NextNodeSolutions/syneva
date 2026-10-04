import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	layout,
} from '@syneva/design-system/tokens.stylex'

import { navMarker, triggerMarker } from './markers.stylex'
import { navClock, navFrame } from './nav.stylex'

// Without scripts the noscript links are parsed into the header and stand in
// for the triggers, which would open nothing. With scripts they stay text, so
// the triggers show from the first paint.
const scriptless = (): string =>
	stylex.when.ancestor(':has(noscript a)', navMarker)
const mobileOpen = (): string =>
	stylex.when.ancestor('[data-mobile-open="true"]', navMarker)
const expanded = (): string =>
	stylex.when.siblingBefore('[aria-expanded="true"]', triggerMarker)
const triggerExpanded = (): string =>
	stylex.when.ancestor('[aria-expanded="true"]', triggerMarker)

const arrive = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(-6px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

// The header bar: the wordmark row, the section triggers with their
// indicator, and the link bar the toggle opens on phones.
export const nav = stylex.create({
	shell: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: {
			default: '88px',
			[media.narrow]: '76px',
			[media.phone]: '68px',
		},
		paddingBlock: 0,
		paddingInline: {
			default: layout['--gutter'],
			[media.navToggle]: '20px',
			[media.tinyPhone]: '16px',
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		gap: {
			default: '24px',
			[media.narrow]: '12px',
			[media.tinyPhone]: '8px',
		},
		position: 'relative',
		zIndex: 10,
		// Closed menus can retain desktop coordinates after a resize.
		overflowX: 'clip',
	},
	links: {
		position: { default: 'relative', [media.navToggle]: 'absolute' },
		display: {
			default: 'flex',
			[media.navToggle]: { default: 'none', [mobileOpen()]: 'flex' },
		},
		justifyContent: {
			default: null,
			[media.navToggle]: {
				default: null,
				[mobileOpen()]: 'space-between',
			},
		},
		alignItems: 'center',
		gap: { default: '6px', [media.narrow]: 0 },
		top: { default: null, [media.navToggle]: 'calc(100% + 8px)' },
		left: {
			default: null,
			[media.navToggle]: navFrame['--nav-dropdown-inset'],
		},
		right: {
			default: null,
			[media.navToggle]: navFrame['--nav-dropdown-inset'],
		},
		padding: { default: null, [media.navToggle]: '4px' },
		backgroundColor: { default: null, [media.navToggle]: color['--white'] },
		borderWidth: { default: null, [media.navToggle]: '1px' },
		borderStyle: { default: null, [media.navToggle]: 'solid' },
		borderColor: { default: null, [media.navToggle]: color['--line'] },
		borderRadius: { default: null, [media.navToggle]: '8px' },
		overflowX: { default: null, [media.smallPhone]: 'auto' },
		scrollbarWidth: { default: null, [media.smallPhone]: 'none' },
		animationName: {
			default: null,
			[media.motionSafe]: { default: null, [mobileOpen()]: arrive },
		},
		animationDuration: {
			default: null,
			[media.motionSafe]: {
				default: null,
				[mobileOpen()]: navClock.barDuration,
			},
		},
		animationTimingFunction: {
			default: null,
			[media.motionSafe]: {
				default: null,
				[mobileOpen()]: navClock.ease,
			},
		},
		animationFillMode: {
			default: null,
			[media.motionSafe]: { default: null, [mobileOpen()]: 'both' },
		},
	},
	item: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '44px',
		paddingBlock: 0,
		// The four items fit the link bar down to 320px; below that it scrolls.
		paddingInline: {
			default: '13px',
			[media.narrow]: '8px',
			[media.smallPhone]: '6px',
			[media.tinyPhone]: '3px',
		},
		// `border: 0` resets the style and colour too, not just the width.
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		backgroundColor: 'transparent',
		fontSize: {
			default: '14px',
			[media.narrow]: '13px',
			[media.navToggle]: '12px',
			[media.smallPhone]: '11.5px',
		},
		fontWeight: 450,
		whiteSpace: 'nowrap',
		// The link bar scrolls on small phones and clips anything outside its
		// box, so the focus ring draws inside the item there, as the panel
		// rows' does.
		outlineOffset: {
			default: null,
			[media.smallPhone]: { default: null, ':focus-visible': '-3px' },
		},
		transition: `color ${duration['--duration-fast']} ${ease['--ease-out']}, background-color ${duration['--duration-fast']} ${ease['--ease-out']}`,
	},
	trigger: {
		display: { default: 'inline-flex', [scriptless()]: 'none' },
		gap: { default: '5px', [media.navToggle]: '2px' },
		color: {
			default: null,
			':is([aria-expanded="true"])': color['--accent'],
			[media.finePointer]: { default: null, ':hover': color['--accent'] },
		},
	},
	direct: {
		marginLeft: { default: '5px', [media.navToggle]: 0 },
		gap: { default: '8px', [media.navToggle]: '4px' },
	},
	// Section-aware navigation: the trigger of the section you are in keeps a
	// quiet accent mark.
	current: { color: color['--accent'] },
	chevron: {
		width: {
			default: '16px',
			[media.navToggle]: '12px',
			[media.smallPhone]: '10px',
		},
		height: {
			default: '16px',
			[media.navToggle]: '12px',
			[media.smallPhone]: '10px',
		},
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
		transition: `transform ${duration['--duration-medium']} ${navClock.ease}`,
		transform: { default: null, [triggerExpanded()]: 'rotate(180deg)' },
	},
	indicator: {
		position: 'absolute',
		bottom: { default: '1px', [media.navToggle]: '4px' },
		left: 0,
		height: '2px',
		width: 'calc(var(--indicator-width, 0) * 1px)',
		backgroundColor: color['--accent'],
		transform: 'translateX(calc(var(--indicator-x, 0) * 1px))',
		opacity: { default: 0, [expanded()]: 1 },
		pointerEvents: 'none',
		transition: `opacity ${duration['--duration-fast']}`,
	},
	noscript: { fontSize: '12px' },
})
