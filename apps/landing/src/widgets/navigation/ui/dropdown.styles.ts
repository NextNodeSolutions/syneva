import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { navMarker } from './markers.stylex'
import { navBounds, navClock, navFrame } from './nav.stylex'

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', navMarker)

// The morphing dropdown: one floating shell whose size, place and reveal the
// runtime animates on the menu clock, holding every section's panel.
export const dropdown = stylex.create({
	base: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 'calc(var(--width, 0) * 1px)',
		height: 'calc(var(--height, 0) * 1px)',
		maxHeight: navBounds['--dropdown-max-height'],
		overflow: 'hidden',
		isolation: 'isolate',
		backgroundColor: color['--white'],
		borderWidth: navFrame['--nav-dropdown-border'],
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
			default: navClock.closeDuration,
			':is([data-open="true"])': '0s',
			[keyboard()]: '0s !important',
		},
	},
})
