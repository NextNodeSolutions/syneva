import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	layout,
} from '@syneva/design-system/tokens.stylex'

import {
	actionMarker,
	dropdownMarker,
	navMarker,
	triggerMarker,
} from './markers.stylex'
import { navClock } from './nav.stylex'

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', navMarker)
const mobileOpen = (): string =>
	stylex.when.ancestor('[data-mobile-open="true"]', navMarker)
const expanded = (): string =>
	stylex.when.siblingBefore('[aria-expanded="true"]', triggerMarker)
const actionHover = (): string => stylex.when.ancestor(':hover', actionMarker)
const triggerExpanded = (): string =>
	stylex.when.ancestor('[aria-expanded="true"]', triggerMarker)

const arrive = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(-6px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

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
		left: { default: null, [media.navToggle]: '12px' },
		right: { default: null, [media.navToggle]: '12px' },
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
			[media.motionSafe]: { default: null, [mobileOpen()]: '280ms' },
		},
		animationTimingFunction: {
			default: null,
			[media.motionSafe]: {
				default: null,
				[mobileOpen()]: navClock['--nav-ease'],
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
		paddingInline: {
			default: '13px',
			[media.narrow]: '8px',
			[media.smallPhone]: '6px',
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
		transition: `color ${duration['--duration-fast']} ${ease['--ease-out']}, background-color ${duration['--duration-fast']} ${ease['--ease-out']}`,
	},
	trigger: {
		gap: { default: '5px', [media.navToggle]: '2px' },
		color: {
			default: null,
			':is([aria-expanded="true"])': color['--accent'],
			[media.finePointer]: { default: null, ':hover': color['--accent'] },
		},
		transform: { default: null, ':active': 'none' },
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
		transition: `transform ${duration['--duration-medium']} ${navClock['--nav-ease']}`,
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
	action: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '8px',
		fontSize: { default: '13px', [media.navToggle]: '12px' },
		fontWeight: 500,
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		backgroundColor: {
			default: color['--white'],
			':hover': color['--wash'],
		},
		color: { default: null, ':hover': color['--accent'] },
		paddingBlock: '9px',
		paddingInline: { default: '15px', [media.navToggle]: '11px' },
		marginLeft: { default: null, [media.navToggle]: 'auto' },
		whiteSpace: 'nowrap',
		transition: `background-color ${duration['--duration-fast']} ${ease['--ease-out']}, border-color ${duration['--duration-fast']} ${ease['--ease-out']}, transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, ':active': 'scale(.97)' },
	},
	actionArrow: {
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, [actionHover()]: 'translateX(2px)' },
	},
	toggle: {
		display: { default: 'none', [media.navToggle]: 'flex' },
		alignItems: { default: null, [media.navToggle]: 'center' },
		gap: { default: null, [media.navToggle]: '5px' },
		paddingBlock: { default: null, [media.navToggle]: 0 },
		paddingInline: { default: null, [media.navToggle]: '5px' },
		minHeight: { default: null, [media.navToggle]: '44px' },
		backgroundColor: { default: null, [media.navToggle]: 'transparent' },
		borderWidth: { default: null, [media.navToggle]: 0 },
		borderStyle: { default: null, [media.navToggle]: 'none' },
		borderColor: { default: null, [media.navToggle]: 'currentcolor' },
		fontSize: { default: null, [media.navToggle]: '13px' },
	},
	toggleLabel: { display: { default: null, [media.tinyPhone]: 'none' } },
	toggleIcon: {
		width: { default: null, [media.navToggle]: '20px' },
		height: { default: null, [media.navToggle]: '20px' },
		stroke: { default: null, [media.navToggle]: 'currentColor' },
		strokeWidth: { default: null, [media.navToggle]: 1.5 },
	},
	dropdown: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 'calc(var(--width, 0) * 1px)',
		height: 'calc(var(--height, 0) * 1px)',
		maxHeight: 'var(--dropdown-max-height)',
		overflow: 'hidden',
		isolation: 'isolate',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		borderRadius: '12px',
		boxShadow: `0 8px 16px -8px color-mix(in srgb, ${color['--ink']} 12%, transparent), 0 24px 56px -16px color-mix(in srgb, ${color['--ink']} 16%, transparent)`,
		// Geometry and reveals share the single morph animation.
		transform:
			'translate3d(calc(var(--x, 0) * 1px), calc(var(--y, 0) * 1px), 0)',
		opacity: 'clamp(0, calc(var(--reveal, 0) * 4), 1)',
		visibility: { default: 'hidden', ':is([data-open="true"])': 'visible' },
		pointerEvents: { default: 'none', ':is([data-open="true"])': 'auto' },
		// Hidden only once the close morph is over. These longhands carry their
		// own keyboard override: merging instant.transitions would replace them.
		transitionProperty: 'visibility',
		transitionDuration: { default: '0s', [keyboard()]: '0s !important' },
		transitionTimingFunction: 'ease',
		transitionDelay: {
			default: navClock['--nav-close-duration'],
			':is([data-open="true"])': '0s',
			[keyboard()]: '0s !important',
		},
	},
	noscript: { fontSize: '12px' },
})

export { dropdownMarker }
