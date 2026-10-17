import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// What a change does to an element, painted the same in every structural block: added in green, changed in petrol, removed in red and struck through. The words say it too (the tag, the text equivalent), never the hue alone.
export const changeTone = stylex.create({
	added: { color: color['--green'], backgroundColor: color['--mint'] },
	changed: { color: color['--accent'], backgroundColor: color['--wash'] },
	removed: { color: color['--red'], backgroundColor: color['--red-tint'] },
})

export const changeOutline = stylex.create({
	added: { outlineColor: color['--green'] },
	changed: { outlineColor: color['--accent'] },
	removed: { outlineColor: color['--red'], opacity: 0.7 },
})

export const changeStroke = stylex.create({
	added: { stroke: color['--green'] },
	changed: { stroke: color['--accent'] },
	removed: { stroke: color['--red'], strokeDasharray: '4 3' },
})

export const changeFill = stylex.create({
	added: { fill: color['--green'] },
	changed: { fill: color['--accent'] },
	removed: { fill: color['--red'] },
})

export const CHANGE_WORDS = {
	added: 'new',
	changed: 'changed',
	removed: 'removed',
} as const

export const CHANGE_SIGNS = {
	added: '+',
	changed: '~',
	removed: '\u2212',
} as const
