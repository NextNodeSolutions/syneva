import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The marks of the home page's drawings (the review gap chart, the desk, the
// question and the local boundary) and of the plan claims the plan desk page
// draws, which the other sections' drawings reuse: part of the kit, not of
// the home view.
export const homeArt = stylex.create({
	gapWritten: {
		fill: 'none',
		stroke: color['--signal'],
		strokeWidth: 2.2,
		strokeLinecap: 'round',
	},
	gapWrittenSignal: {
		fill: 'none',
		stroke: color['--accent'],
		strokeWidth: 4,
		strokeLinecap: 'round',
	},
	gapRead: { fill: 'none', stroke: color['--ink'], strokeWidth: 1.4 },
	gapSteps: { fill: 'none', stroke: color['--green'], strokeWidth: 1.6 },
	gapRound: { fill: color['--mint'], stroke: color['--green'] },
	gapTag: { fill: color['--white'], stroke: color['--accent'] },
	gapPointer: { stroke: color['--green'], fill: 'none' },
	gapHatch: { stroke: color['--signal'], strokeWidth: 1.2, opacity: 0.42 },
	deskCursor: {
		fill: color['--signal'],
		fillOpacity: 0.1,
		stroke: color['--accent'],
		strokeWidth: 1,
	},
	deskNext: {
		fill: 'none',
		stroke: color['--accent'],
		strokeDasharray: '3 3',
	},
	askAnchor: { stroke: color['--accent'], fill: 'none' },
	askThread: { fill: color['--wash-tint'], stroke: color['--line'] },
	askRail: { stroke: color['--accent'], strokeWidth: 2 },
	askTab: { fill: color['--white'], stroke: color['--line-strong'] },
	askTabOn: { fill: color['--accent'], stroke: color['--accent'] },
	askSpin: {
		fill: 'none',
		stroke: color['--accent'],
		strokeWidth: 1.5,
		strokeDasharray: '16 9',
	},
	askChange: { fill: color['--white'], stroke: color['--line'] },
	askChangeRail: { stroke: color['--signal'], strokeWidth: 2 },
	planHighlight: { fill: color['--wash'] },
	planClaim: { fill: color['--white'], stroke: color['--ink'] },
	planRisk: { fill: color['--wash'], stroke: color['--accent'] },
	planSettled: { fill: color['--mint'], stroke: color['--green'] },
	localBoundary: {
		fill: `color-mix(in srgb, ${color['--white']} 35%, transparent)`,
		stroke: color['--ink'],
	},
	localCaret: { fill: color['--accent'] },
	localSignal: {
		fill: 'none',
		stroke: color['--signal'],
		strokeWidth: 2.4,
		strokeLinecap: 'round',
	},
	localSignalGreen: { stroke: color['--green'] },
	localOut: { stroke: color['--line-strong'], fill: 'none' },
	localCut: { fill: color['--wash'], stroke: color['--accent'] },
	localCutX: {
		stroke: color['--accent'],
		strokeWidth: 1.6,
		strokeLinecap: 'round',
	},
	localCloud: {
		fill: 'none',
		stroke: color['--line-strong'],
		strokeDasharray: '3 3',
	},
})
