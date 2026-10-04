import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Drawing marks shared by every SVG figure on the site.
const stroke = (paint: string): { stroke: string; fill: string } => ({
	stroke: paint,
	fill: 'none',
})

export const shape = stylex.create({
	// A reframed drawing never scales past ~1.5x its subject.
	compactFrame: {
		maxWidth: { default: null, [media.phone]: '460px' },
		marginInline: { default: null, [media.phone]: 'auto' },
	},
	secondary: { display: { default: null, [media.phone]: 'none' } },
	register: { stroke: color['--line-strong'] },
	panel: { fill: color['--paper'], stroke: color['--line-strong'] },
	panelWhite: { fill: color['--white'], stroke: color['--ink'] },
	panelMint: { fill: color['--mint'], stroke: color['--green'] },
	panelWash: { fill: color['--wash'], stroke: color['--accent'] },
	hair: stroke(color['--line']),
	route: stroke(color['--line-strong']),
	routeDotted: {
		strokeDasharray: '1 6',
		strokeLinecap: 'round',
		strokeWidth: 1.2,
	},
	routeAccent: { stroke: color['--accent'] },
	routeGreen: { stroke: color['--green'] },
	lines: stroke(color['--line-strong']),
	inkLine: stroke(color['--ink']),
	yes: { fill: color['--mint'], stroke: color['--green'] },
	no: { fill: color['--wash'], stroke: color['--accent'] },
	check: {
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 1.6,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	cross: {
		fill: 'none',
		stroke: color['--accent'],
		strokeWidth: 1.5,
		strokeLinecap: 'round',
	},
	pending: {
		fill: color['--white'],
		stroke: color['--line-strong'],
		strokeDasharray: '2 2',
	},
	bandYes: { fill: color['--mint'] },
	bandNo: { fill: color['--wash'] },
	bandAdd: { fill: '#eef5ec' },
	bandFocus: { fill: color['--signal'], fillOpacity: 0.1 },
	chipYes: { fill: color['--mint'], stroke: color['--green'] },
	chipNo: { fill: color['--wash'], stroke: color['--accent'] },
	strike: { stroke: color['--accent'], strokeWidth: 1.4, fill: 'none' },
	kbd: { fill: color['--white'], stroke: color['--line-strong'] },
	track: { fill: color['--line'] },
	fill: { fill: color['--green'] },
	dot: { fill: color['--green'] },
	dotAccent: { fill: color['--accent'] },
	port: { fill: color['--paper'], stroke: color['--line-strong'] },
	signal: {
		fill: 'none',
		stroke: color['--signal'],
		strokeWidth: 2,
		strokeLinecap: 'round',
	},
	signalGreen: { stroke: color['--green'] },
	bracket: { fill: 'none', stroke: color['--accent'], strokeWidth: 1.5 },
})
