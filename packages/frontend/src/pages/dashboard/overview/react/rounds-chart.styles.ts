import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

import { slotMarker } from './rounds-chart.stylex'

// Rounds sent per day: one series, so no legend (the cell's title names it), petrol bars on a
// strong baseline with a hairline grid behind, square like everything in the system. Each bar
// grows from the baseline as the chart enters (the entrance runtime's growUp, after its cell);
// today's carries its number.
const PERCENT = 100

const slotHover = (): string => stylex.when.ancestor(':hover', slotMarker)

export const roundsChart = stylex.create({
	plot: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
		alignItems: 'end',
		columnGap: '6px',
		height: '128px',
		// Room over the bars for a day's tip, which opens above them.
		marginTop: '30px',
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
			[media.finePointer]: {
				default: color['--accent'],
				[slotHover()]: color['--accent-deep'],
			},
		},
		transformOrigin: 'bottom',
		transition: `background-color ${transition.fast}`,
	},
	barZero: { backgroundColor: color['--line-strong'], minHeight: '1px' },
	height: (share: number) => ({ height: `${share * PERCENT}%` }),
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
