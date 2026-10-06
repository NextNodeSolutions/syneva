import * as stylex from '@stylexjs/stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

// Rounds sent per day: one series, so no legend (the cell's title names it), petrol bars on a
// strong baseline with a hairline grid behind, square like everything in the system. Each bar
// grows from the baseline when the chart enters; today's carries its number.
const PERCENT = 100

const grow = stylex.keyframes({
	'0%': { transform: 'scaleY(0)' },
	'100%': { transform: 'scaleY(1)' },
})

export const roundsChart = stylex.create({
	plot: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
		alignItems: 'end',
		columnGap: '6px',
		height: '128px',
		marginTop: '22px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
		backgroundImage: `linear-gradient(${color['--line']} 1px, transparent 1px)`,
		backgroundSize: '100% 32px',
	},
	slot: {
		position: 'relative',
		display: 'flex',
		alignItems: 'flex-end',
		height: '100%',
		cursor: 'default',
	},
	bar: {
		position: 'relative',
		width: '100%',
		minHeight: '2px',
		backgroundColor: {
			default: color['--accent'],
			':hover': color['--accent-deep'],
		},
		transformOrigin: 'bottom',
		animationName: grow,
		animationDuration: '520ms',
		animationTimingFunction: ease['--ease-out'],
		animationFillMode: 'backwards',
	},
	barZero: { backgroundColor: color['--line-strong'], minHeight: '1px' },
	height: (share: number) => ({ height: `${share * PERCENT}%` }),
	delay: (ms: number) => ({ animationDelay: `${ms}ms` }),
	label: {
		position: 'absolute',
		bottom: 'calc(100% + 4px)',
		left: '50%',
		transform: 'translateX(-50%)',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--ink'],
	},
	axis: {
		display: 'grid',
		gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
		columnGap: '6px',
		marginTop: '6px',
		fontFamily: font['--mono'],
		fontSize: '9.5px',
		color: color['--muted'],
		textAlign: 'center',
		whiteSpace: 'nowrap',
	},
})
