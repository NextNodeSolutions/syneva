import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

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
	chevron: { fill: 'none', stroke: color['--ink'], strokeWidth: 1.4 },
	chevronOpen: {
		stroke: color['--accent'],
		transform: 'rotate(180deg)',
		transformBox: 'fill-box',
		transformOrigin: 'center',
	},
	answer: { fill: color['--wash-tint'] },
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
