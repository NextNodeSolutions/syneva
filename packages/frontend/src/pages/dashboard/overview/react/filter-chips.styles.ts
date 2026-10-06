import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// The filters in force as a row of petrol chips under the head, each closing itself. The row
// opens and closes by its height (a grid track easing between none and its content), so the
// page under it slides rather than jumps when the first filter is set or the last one lifted.
export const chips = stylex.create({
	reveal: {
		display: 'grid',
		gridTemplateRows: '0fr',
		transition: `grid-template-rows ${duration['--duration-medium']} ${ease['--ease-out']}`,
	},
	revealShown: { gridTemplateRows: '1fr' },
	clip: { minHeight: 0, overflow: 'hidden' },
	bar: {
		display: 'flex',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: '8px',
		paddingBlock: '10px',
		paddingInline: { default: '32px', [media.stacked]: '16px' },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	chip: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		minHeight: '26px',
		paddingInline: '8px',
		fontFamily: 'inherit',
		fontSize: '12px',
		color: color['--accent'],
		backgroundColor: {
			default: color['--wash'],
			[media.finePointer]: {
				default: color['--wash'],
				':hover': color['--white'],
			},
		},
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--accent-line'],
		cursor: 'pointer',
		transform: { default: null, ':active': 'scale(.97)' },
		transition: `background-color ${transition.fast}, transform ${transition.fast}`,
	},
	kind: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
	},
	cross: { width: '12px', height: '12px' },
	// As tall as the chips, and a finger's height on phones.
	clear: {
		display: 'inline-flex',
		alignItems: 'center',
		minHeight: { default: '26px', [media.stacked]: '40px' },
		paddingInline: '4px',
		fontFamily: 'inherit',
		fontSize: '12px',
		color: {
			default: color['--muted'],
			[media.finePointer]: {
				default: color['--muted'],
				':hover': color['--ink'],
			},
		},
		backgroundColor: 'transparent',
		borderWidth: 0,
		textDecoration: 'underline',
		textUnderlineOffset: '3px',
		cursor: 'pointer',
		transition: `color ${transition.fast}`,
	},
})
