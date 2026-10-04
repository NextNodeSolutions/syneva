import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { motionRoot } from '@syneva/motion/root.stylex'

const armed = (): string => stylex.when.ancestor('[data-motion]', motionRoot)
// A dashed stroke that also draws on: while armed, the drawing pose's single
// dash wins over the pattern.
type Dashed = { readonly default: string } & Readonly<
	Record<string, string | number>
>
type DrawnDash = { readonly default: string } & Readonly<
	Record<string, string | Dashed>
>
const drawnDash = (pattern: string): DrawnDash => ({
	default: pattern,
	[media.motionSafe]: { default: pattern, [armed()]: 1 },
})

// The marks of the home page's drawings (the review gap chart, the desk, the
// question, the plan and the local boundary), which the other sections'
// drawings reuse: part of the kit, not of the home view.
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
	planBus: { stroke: color['--accent'], strokeWidth: 1.5 },
	planSignal: { stroke: color['--signal'], strokeWidth: 3 },
	planDot: { fill: color['--accent'] },
	planClaim: { fill: color['--white'], stroke: color['--ink'] },
	planRisk: { fill: color['--wash'], stroke: color['--accent'] },
	planSettled: { fill: color['--mint'], stroke: color['--green'] },
	planFlag: { fill: color['--accent'] },
	localBoundary: {
		fill: `color-mix(in srgb, ${color['--white']} 35%, transparent)`,
		stroke: color['--ink'],
		strokeDasharray: drawnDash('5 4'),
	},
	localCaret: { fill: color['--accent'] },
	localSignal: {
		fill: 'none',
		stroke: color['--signal'],
		strokeWidth: 2.4,
		strokeLinecap: 'round',
	},
	localSignalGreen: { stroke: color['--green'] },
	localOut: {
		stroke: color['--line-strong'],
		strokeDasharray: drawnDash('3 3'),
		fill: 'none',
	},
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
