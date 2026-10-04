import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
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
	tiny: {
		font: mono('9.5px'),
		fontSize: { default: null, [media.phone]: '10.5px' },
		letterSpacing: '.06em',
		fill: color['--muted'],
	},
	file: { font: mono('10.5px'), fill: color['--ink'] },
	strong: { fontWeight: 600 },
	index: { font: `500 ${mono('10.5px')}`, fill: color['--accent'] },
	sheet: { fill: color['--white'], stroke: color['--line-strong'] },
	hair: { stroke: color['--line'], fill: 'none' },
	bar: { fill: color['--line-strong'] },
	faintBar: { fill: color['--line'] },
	markAdded: { fill: color['--green'] },
	markRemoved: { fill: color['--signal'] },
	markContext: { fill: color['--line'] },
	rail: { stroke: color['--accent'], strokeWidth: 1.2, fill: 'none' },
	railDot: { fill: color['--accent'] },
	revBox: { fill: color['--wash'], stroke: color['--accent'] },
	revText: {
		font: `500 ${mono('9px')}`,
		letterSpacing: '.08em',
		fill: color['--accent'],
	},
	focus: { stroke: color['--accent'], strokeWidth: 1.5 },
	port: { fill: color['--paper'], stroke: color['--line-strong'] },
	route: { stroke: color['--line-strong'] },
	return: {
		stroke: color['--line-strong'],
		strokeDasharray: '1 6',
		strokeLinecap: 'round',
		strokeWidth: 1.2,
	},
	signal: {
		strokeWidth: 2,
		strokeLinecap: 'round',
		opacity: 0,
		strokeDasharray: '8 100',
		strokeDashoffset: 8,
	},
	signalIn: { stroke: color['--signal'] },
	signalOut: { stroke: color['--green'] },
	signalBack: { stroke: color['--signal'], strokeDasharray: '5 100' },
	loop: {
		font: mono('9.5px'),
		letterSpacing: '.1em',
		fill: color['--muted'],
	},
	panel: { fill: color['--white'], stroke: color['--ink'] },
	button: { fill: color['--white'], stroke: color['--line-strong'] },
	buttonGlyph: {
		stroke: color['--muted'],
		strokeWidth: 1.4,
		fill: 'none',
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	accept: { fill: color['--mint'], stroke: color['--green'] },
	acceptGlyph: { stroke: color['--green'] },
	bandDel: { fill: color['--wash'] },
	bandAdd: { fill: color['--mint'] },
	sweep: { fill: color['--signal'], fillOpacity: 0.1 },
	lineNumber: { font: mono('10.5px'), fill: color['--line-strong'] },
	code: { font: mono('11.5px'), fill: color['--ink'] },
	sign: { font: mono('11.5px') },
	del: { fill: color['--accent'] },
	add: { fill: color['--green'] },
	strike: { stroke: color['--accent'], strokeWidth: 1.2 },
	gutterCheck: {
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 1.6,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	leader: { stroke: color['--accent'], fill: 'none' },
	chipDot: { fill: color['--wash'], stroke: color['--accent'] },
	chipText: { font: `600 ${sans('11px')}`, fill: color['--accent'] },
	threadBox: { fill: color['--wash-tint'], stroke: color['--line'] },
	threadRail: { stroke: color['--accent'], strokeWidth: 2 },
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
	typingDot: { fill: color['--accent'] },
	ledgerBox: { fill: color['--paper'], stroke: color['--line-strong'] },
	glyphYes: { fill: color['--mint'], stroke: color['--green'] },
	glyphCheck: {
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 1.5,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	glyphNo: { fill: color['--wash'], stroke: color['--accent'] },
	glyphX: {
		stroke: color['--accent'],
		strokeWidth: 1.4,
		strokeLinecap: 'round',
	},
	glyphPending: {
		fill: color['--white'],
		stroke: color['--line-strong'],
		strokeDasharray: '2 2',
	},
	track: { fill: color['--line'] },
	fill: { fill: color['--green'] },
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
	// The instrument reframes onto the desk on phones (data-compact): its side
	// columns and long routes would only show as cut-off fragments.
	phoneHidden: { display: { default: null, [media.phone]: 'none' } },
})
