import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// The next round's way back, under the stations: a dotted petrol rule from the Sent station's
// foot round to the agent's, arriving on an arrowhead. Its ends sit on the outer stations'
// centre lines: each station is a third of the row less the two 72px routes.
const PHONE = media.stacked

export const circuitReturn = stylex.create({
	path: {
		display: { default: 'block', [PHONE]: 'none' },
		position: 'relative',
		height: '22px',
		marginInline: 'calc((100% - 144px) / 6)',
		color: color['--accent-line'],
	},
	line: {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
		overflow: 'visible',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
		strokeDasharray: '2 5',
	},
	head: {
		position: 'absolute',
		top: '-3px',
		left: '-5px',
		width: '10px',
		height: '10px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
	},
	foot: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: { default: 'center', [PHONE]: 'flex-end' },
		gap: '16px',
		minHeight: '28px',
		marginTop: { default: '2px', [PHONE]: '10px' },
	},
	// A sentence, so in the chrome's sans and in sentence case (the Two-Voice rule).
	caption: {
		display: { default: 'block', [PHONE]: 'none' },
		fontFamily: font['--sans'],
		fontSize: '12px',
		color: color['--muted'],
		textAlign: 'center',
	},
	idle: {
		position: { default: 'absolute', [PHONE]: 'static' },
		right: '32px',
		bottom: '14px',
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		minHeight: '28px',
		paddingInline: '8px',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: {
			default: color['--muted'],
			[media.finePointer]: {
				default: color['--muted'],
				':hover': color['--ink'],
			},
		},
		backgroundColor: 'transparent',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		cursor: 'pointer',
		// It gives under the pointer, as every control does (press.control).
		transform: { default: null, ':active': 'scale(.97)' },
		transition: `color ${transition.fast}, background-color ${transition.fast}, border-color ${transition.fast}, transform ${transition.fast}`,
	},
	idleOn: {
		color: color['--ink'],
		backgroundColor: color['--field'],
		borderColor: color['--line-strong'],
	},
})
