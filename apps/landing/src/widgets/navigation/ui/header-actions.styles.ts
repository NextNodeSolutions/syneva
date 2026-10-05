import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import { actionMarker, navMarker, toggleMarker } from './markers.stylex'
import { navClock } from './nav.stylex'

const actionHover = (): string => stylex.when.ancestor(':hover', actionMarker)
const toggleOpen = (): string =>
	stylex.when.ancestor('[aria-expanded="true"]', toggleMarker)
// Without scripts the noscript links are parsed into the header and the
// toggle, which would open nothing, gives way to them.
const scriptless = (): string =>
	stylex.when.ancestor(':has(noscript a)', navMarker)

// The header's actions after the links: the primary action, and the toggle
// that opens the link bar on phones.
export const headerActions = stylex.create({
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
	},
	actionArrow: {
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, [actionHover()]: 'translateX(2px)' },
	},
	toggle: {
		display: {
			default: 'none',
			[media.navToggle]: { default: 'flex', [scriptless()]: 'none' },
		},
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
	// The two bars cross into a close mark while the bar is open: each meets
	// the icon's centre line, then turns about the centre (10, 10 in its
	// viewBox).
	toggleBar: {
		transformOrigin: '10px 10px',
		transition: `transform ${navClock.barDuration} ${navClock.ease}`,
	},
	toggleTop: {
		transform: {
			default: null,
			[toggleOpen()]: 'rotate(45deg) translateY(3px)',
		},
	},
	toggleBottom: {
		transform: {
			default: null,
			[toggleOpen()]: 'rotate(-45deg) translateY(-3px)',
		},
	},
})
