import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease } from '@syneva/design-system/tokens.stylex'

// A panel that has left the page for a moment: white under a strong rule with the system's one
// floating shadow (DESIGN.md, Elevation), square, opening down from its trigger with a short
// fall and fade.
const open = stylex.keyframes({
	'0%': { opacity: 0, transform: 'translateY(-4px)' },
	'100%': { opacity: 1, transform: 'none' },
})

export const popover = stylex.create({
	anchor: { position: 'relative', display: 'inline-flex' },
	panel: {
		position: 'absolute',
		zIndex: 50,
		boxSizing: 'border-box',
		minWidth: '260px',
		maxWidth: 'min(360px, calc(100vw - 24px))',
		maxHeight: 'min(70vh, 560px)',
		overflowY: 'auto',
		paddingBlock: '6px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		boxShadow: '0 12px 32px rgb(25 27 24 / 14%)',
		animationName: open,
		animationDuration: '160ms',
		animationTimingFunction: ease['--ease-out'],
	},
	// Where the panel opens, from its trigger (popover.tsx placeUnder).
	at: (top: number, left: number) => ({ top: `${top}px`, left: `${left}px` }),
	// Open, or holding a choice in force: on the wash inside a petrol hairline, which still
	// deepens under the pointer.
	triggerOn: {
		color: color['--accent'],
		backgroundColor: color['--wash'],
		borderColor: {
			default: color['--accent-line'],
			[media.finePointer]: {
				default: color['--accent-line'],
				':hover': color['--accent'],
			},
		},
	},
})
