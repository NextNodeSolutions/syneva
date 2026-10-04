import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import { actionMarker } from './markers.stylex'

const actionHover = (): string => stylex.when.ancestor(':hover', actionMarker)

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
})
