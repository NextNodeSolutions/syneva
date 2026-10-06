import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease } from '@syneva/design-system/tokens.stylex'
import { shellEdge } from '@widgets/hub-shell/react/shell-edge.stylex'

const rise = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'none' },
})

const leave = stylex.keyframes({
	from: { opacity: 1, transform: 'none' },
	to: { opacity: 0, transform: 'translateY(4px)' },
})

// The page's inset (its head and body start 32px into the column, 16px on phones).
const PAGE_INSET = '32px'

// The toast holds the page's own left edge at the bottom of the screen, clear of the sidebar (or the rail) beside it; on phones it spans the screen less a small margin.
export const closeNotice = stylex.create({
	root: {
		position: 'fixed',
		zIndex: 30,
		bottom: { default: '24px', [media.phone]: '12px' },
		left: {
			default: `calc(${shellEdge.page} + ${PAGE_INSET})`,
			[media.stacked]: '16px',
			[media.phone]: '12px',
		},
		right: { default: 'auto', [media.phone]: '12px' },
		width: {
			default: 'min(440px, calc(100vw - 32px))',
			[media.phone]: 'auto',
		},
	},
	sheet: {
		boxShadow: `0 0 0 8px ${color['--paper']}`,
		animationName: { default: null, [media.motionSafe]: rise },
		animationDuration: '200ms',
		animationTimingFunction: ease['--ease-out'],
	},
	// Dismissed or timed out: it fades and sinks a little (use-close-notice.ts LEAVE_MS).
	leaving: {
		animationName: { default: null, [media.motionSafe]: leave },
		animationDuration: '150ms',
		animationFillMode: 'forwards',
		pointerEvents: 'none',
	},
})
