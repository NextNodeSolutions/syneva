import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/tokens/tokens.stylex'

const box = (
	fill: string,
	stroke: string,
): { fill: string; stroke: string } => ({ fill, stroke })

// Resources, open source and 404 drawings.
export const resourcesArt = stylex.create({
	tocLeader: {
		stroke: color['--line-strong'],
		strokeDasharray: '1 5',
		strokeLinecap: 'round',
		fill: 'none',
	},
	tocRibbon: { fill: color['--accent'] },
	tocRibbonCut: { fill: color['--field'] },
	termDot: box(color['--white'], color['--line-strong']),
	termDotAccent: box(color['--wash'], color['--accent']),
	wirePill: box(color['--white'], color['--line-strong']),
	wireEvent: box(color['--wash'], color['--accent']),
	chevron: { fill: 'none', stroke: color['--ink'], strokeWidth: 1.4 },
	chevronOpen: {
		stroke: color['--accent'],
		transform: 'rotate(180deg)',
		transformBox: 'fill-box',
		transformOrigin: 'center',
	},
	answer: { fill: color['--wash-tint'] },
	feat: box(color['--mint'], color['--green']),
	fix: box(color['--wash'], color['--accent']),
	perf: box(color['--white'], color['--ink']),
	slot: {
		fill: color['--paper'],
		stroke: color['--line-strong'],
		strokeDasharray: '4 3',
	},
	stamp: {
		fill: color['--wash'],
		stroke: color['--accent'],
		strokeWidth: 1.5,
	},
})
