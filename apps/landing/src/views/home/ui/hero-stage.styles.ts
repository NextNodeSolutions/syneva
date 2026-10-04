import * as stylex from '@stylexjs/stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

const mono = (size: string): string => `${size} ${font['--mono']}`
const sans = (size: string): string => `${size} ${font['--sans']}`

// The hero instrument: one review round drawn as a flat technical figure.
export const heroStage = stylex.create({
	root: { overflow: 'visible' },
	kicker: {
		font: `500 ${mono('10.5px')}`,
		letterSpacing: '.09em',
		fill: color['--ink'],
	},
	sub: { font: sans('12px'), fill: color['--muted'] },
	mono: { font: mono('11px') },
	index: { font: `500 ${mono('10.5px')}`, fill: color['--accent'] },
	bar: { fill: color['--line-strong'] },
	faintBar: { fill: color['--line'] },
	markAdded: { fill: color['--green'] },
	markRemoved: { fill: color['--signal'] },
	markContext: { fill: color['--line'] },
	rail: { stroke: color['--accent'], strokeWidth: 1.2, fill: 'none' },
	revText: {
		font: `500 ${mono('9px')}`,
		letterSpacing: '.08em',
		fill: color['--accent'],
	},
	focus: { stroke: color['--accent'], strokeWidth: 1.5 },
	loop: {
		font: mono('9.5px'),
		letterSpacing: '.1em',
		fill: color['--muted'],
	},
	buttonGlyph: {
		stroke: color['--muted'],
		strokeWidth: 1.4,
		fill: 'none',
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	acceptGlyph: { stroke: color['--green'] },
	sign: { font: mono('11.5px') },
	strike: { stroke: color['--accent'], strokeWidth: 1.2 },
	leader: { stroke: color['--accent'], fill: 'none' },
	chipText: { font: `600 ${sans('11px')}`, fill: color['--accent'] },
	who: {
		font: mono('9.5px'),
		letterSpacing: '.08em',
		fill: color['--muted'],
	},
	agentWho: { fill: color['--accent'] },
	message: {
		font: sans('12.5px'),
		fill: color['--ink'],
		letterSpacing: '-.01em',
	},
	sendBox: { fill: color['--accent'] },
	sendLabel: { font: `500 ${sans('12.5px')}`, fill: color['--white'] },
	sendKey: { font: mono('10px'), fill: color['--white'], fillOpacity: 0.75 },
	caret: { fill: color['--accent'] },
	cursor: {
		fill: color['--white'],
		stroke: color['--ink'],
		strokeWidth: 1.1,
		strokeLinejoin: 'round',
	},
	// Pointer depth drifts the three columns a few pixels apart.
	layer: { transition: `translate .9s ${ease['--ease-out']}` },
	// Pieces the timeline scales transform about their own centre, and the
	// ones it grows sideways (code bars, the strike, the progress fill) from
	// their left edge. The cursor keeps the view box: its moves are
	// coordinates on the figure.
	fillBox: { transformBox: 'fill-box', transformOrigin: 'center' },
	fillBoxLeft: { transformBox: 'fill-box', transformOrigin: 'left center' },
})
