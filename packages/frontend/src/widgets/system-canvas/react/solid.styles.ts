import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Raised, the system keeps the plan's palette and the isometric drawing's of the public site: a block is a white top on pale sides ruled in the strong line, a slab or a platform the platform tint under a dashed rule. The change is the one strong colour, here as in the plan: an added block is green on its mint, a changed one petrol on its wash, a removed one a red dashed ghost of its footprint. Pointed at, a part's rule turns petrol; selected, it takes the wash and a heavier rule. A slab is a little translucent, so what lies under it (the system before, seen through the floor after) shows through, stepped back.

const END = `color-mix(in srgb, ${color['--iso-side']} 78%, ${color['--line-strong']})`
const MINT_END = `color-mix(in srgb, ${color['--iso-mint-side']} 80%, ${color['--green']})`
const WASH_END = `color-mix(in srgb, ${color['--iso-wash-side']} 80%, ${color['--accent']})`

export const solid = stylex.create({
	face: {
		stroke: color['--line-strong'],
		strokeWidth: 1,
		strokeLinejoin: 'round',
		cursor: 'pointer',
	},
	top: { fill: color['--white'] },
	side: { fill: color['--iso-side'] },
	end: { fill: END },
	platformTop: { fill: color['--iso-platform'], strokeDasharray: '4 3' },
	slab: {
		fill: color['--iso-platform'],
		fillOpacity: 0.86,
		stroke: color['--line-strong'],
		strokeWidth: 1,
		strokeLinejoin: 'round',
		pointerEvents: 'none',
	},
	slabTop: { strokeDasharray: '4 3' },
	lit: { stroke: color['--accent'], strokeWidth: 1.5 },
	selectedTop: {
		fill: color['--wash'],
		stroke: color['--accent'],
		strokeWidth: 2,
	},
	dim: { opacity: 0.28 },
	quiet: { opacity: 0.42 },
	link: { pointerEvents: 'none' },
	trace: {
		fill: 'none',
		stroke: color['--line-strong'],
		strokeWidth: 1,
		strokeDasharray: '2 3',
		pointerEvents: 'none',
	},
	traceLit: { stroke: color['--accent'], strokeDasharray: 'none' },
})

// A block's faces by the change it shows: top, sides along x, ends along y.
export const markFace = stylex.create({
	addedTop: { fill: color['--mint'], stroke: color['--green'] },
	addedSide: { fill: color['--iso-mint-side'], stroke: color['--green'] },
	addedEnd: { fill: MINT_END, stroke: color['--green'] },
	changedTop: { fill: color['--wash-tint'], stroke: color['--accent'] },
	changedSide: { fill: color['--iso-wash-side'], stroke: color['--accent'] },
	changedEnd: { fill: WASH_END, stroke: color['--accent'] },
	removedTop: {
		fill: color['--red-tint'],
		fillOpacity: 0.6,
		stroke: color['--red'],
		strokeDasharray: '4 3',
	},
	removedSide: {
		fill: color['--red-tint'],
		fillOpacity: 0.6,
		stroke: color['--red'],
		strokeDasharray: '4 3',
	},
	removedEnd: {
		fill: color['--red-tint'],
		fillOpacity: 0.6,
		stroke: color['--red'],
		strokeDasharray: '4 3',
	},
})
