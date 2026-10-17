import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// Raised, the system keeps the plan's palette and the isometric drawing's of the public site: a block is a white top on pale sides ruled in the strong line, a platform the platform tint under a dashed rule. A change rules the block in its colour, the domain pointed at puts its parts on the wash, a selected part takes the wash and a heavier rule.

const END = `color-mix(in srgb, ${color['--iso-side']} 78%, ${color['--line-strong']})`
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
	litTop: { fill: color['--wash-tint'], stroke: color['--accent'] },
	litSide: { fill: color['--iso-wash-side'], stroke: color['--accent'] },
	litEnd: { fill: WASH_END, stroke: color['--accent'] },
	selectedTop: {
		fill: color['--wash'],
		stroke: color['--accent'],
		strokeWidth: 2,
	},
	platformLit: { stroke: color['--accent'] },
	dim: { opacity: 0.3 },
	link: { pointerEvents: 'none' },
})
