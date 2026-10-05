import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease, layout } from '@syneva/design-system/tokens.stylex'

const rise = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'none' },
})

// The toast holds the frame's gutter line at the bottom of the screen (the frame is centred
// at 1280px); on phones it spans the screen less a small margin.
export const closeNotice = stylex.create({
	root: {
		position: 'fixed',
		zIndex: 30,
		bottom: { default: '24px', [media.phone]: '12px' },
		left: {
			default: `max(${layout['--gutter']}, calc((100vw - 1280px) / 2 + ${layout['--gutter']}))`,
			[media.phone]: '12px',
		},
		right: { default: 'auto', [media.phone]: '12px' },
		width: {
			default: `min(440px, calc(100vw - 2 * ${layout['--gutter']}))`,
			[media.phone]: 'auto',
		},
	},
	// Each notice rises in as it replaces the last (the container stays mounted: it is the
	// live region). A paper margin rings the sheet - the focus ring's own gap, not a shadow -
	// so the rows it passes over stop short of its rule instead of running under it.
	sheet: {
		boxShadow: `0 0 0 8px ${color['--paper']}`,
		animationName: { default: null, [media.motionSafe]: rise },
		animationDuration: '200ms',
		animationTimingFunction: ease['--ease-out'],
	},
})
