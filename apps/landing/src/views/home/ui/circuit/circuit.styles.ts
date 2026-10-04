import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The review circuit: sheets, stations and routes in two dimensions. The
// leaves inside <defs> are drawn through <use>, so their paints read custom
// properties each layer sets (leaf fill, border, side and code accent).
export const circuit = stylex.create({
	// Drawing sizes the root. The phone frame is a wide 900 units, so the
	// circuit keeps the column's full width instead of the 460px cap a
	// reframed drawing takes.
	root: {
		maxWidth: { default: null, [media.phone]: 'none' },
		minHeight: { default: null, [media.phone]: 0 },
		aspectRatio: { default: null, [media.phone]: '45 / 26' },
		backgroundColor: color['--paper'],
		'--leaf-fill': color['--white'],
		'--leaf-border': color['--line-strong'],
		'--leaf-side': color['--iso-side'],
		'--code-ink': color['--muted'],
		'--code-accent': color['--signal'],
	},
	register: { display: { default: null, [media.phone]: 'none' } },
	routes: {
		stroke: color['--line-strong'],
		strokeWidth: { default: 1, [media.phone]: 1.3 },
		strokeLinecap: 'round',
	},
	// Dots have one meaning: the next revision, not a second forward route.
	returnRoute: { strokeDasharray: '1 7' },
	port: {
		fill: color['--paper'],
		stroke: color['--line-strong'],
		strokeWidth: 1,
	},
	foot: {
		fill: color['--iso-platform'],
		stroke: color['--line-strong'],
		strokeWidth: { default: null, [media.phone]: 1.5 },
	},
	rim: {
		fill: color['--iso-side'],
		stroke: color['--line-strong'],
		strokeLinejoin: 'round',
	},
	mark: { color: color['--muted'] },
	leafFace: {
		fill: 'var(--leaf-fill)',
		stroke: 'var(--leaf-border)',
		strokeWidth: { default: 1.2, [media.phone]: 1.5 },
		strokeLinejoin: 'round',
	},
	leafEdge: {
		fill: 'var(--leaf-side)',
		stroke: 'var(--leaf-border)',
		strokeWidth: 1,
		strokeLinejoin: 'round',
	},
	leafFold: { fill: 'none', stroke: 'var(--leaf-border)' },
	leafCode: {
		fill: 'none',
		stroke: 'var(--code-ink)',
		strokeWidth: 3,
		strokeLinecap: 'square',
	},
	codeAccent: { stroke: 'var(--code-accent)', strokeWidth: 5 },
	codeFaint: { opacity: 0.35 },
	sourceLeaves: { '--code-accent': color['--line-strong'] },
	seat: {
		fill: color['--wash'],
		fillOpacity: 0.4,
		stroke: color['--accent'],
	},
	// Each review layer lifts open to its own height, the static pose; the
	// loop (circuit-loop.ts) reads --lift and stacks the layers in between.
	layer: { transform: 'translateY(var(--lift))' },
	critical: {
		'--lift': '-156px',
		'--leaf-border': color['--accent'],
		'--leaf-side': color['--iso-wash-side'],
		color: color['--accent'],
	},
	important: {
		'--lift': '-66px',
		'--code-accent': color['--line-strong'],
		color: color['--line-strong'],
	},
	tested: {
		'--lift': '24px',
		'--leaf-fill': color['--mint'],
		'--leaf-side': color['--iso-mint-side'],
		'--code-accent': color['--green'],
		color: color['--green'],
	},
	criticalMargin: { stroke: color['--accent'], strokeWidth: 2 },
	focusFrame: {
		stroke: color['--accent'],
		strokeWidth: 1.2,
		transformOrigin: '0 0',
	},
	focusOwner: { fill: color['--accent'] },
	focusOwnerPath: { stroke: color['--accent'], strokeWidth: 1 },
	focusOwnerText: {
		font: {
			default: `10px ${font['--mono']}`,
			[media.phone]: `500 23px ${font['--sans']}`,
		},
		letterSpacing: { default: '.08em', [media.phone]: 0 },
	},
	sweep: { fill: color['--signal'], opacity: 0 },
	// Keep the notes' clock alive on phones so widening cannot restart them.
	note: { visibility: { default: null, [media.phone]: 'hidden' } },
	notePath: { stroke: 'currentColor', strokeWidth: 1 },
	noteDot: { fill: 'currentColor' },
	noteTitle: {
		fill: color['--ink'],
		font: `500 14px ${font['--sans']}`,
		fontSize: { default: null, [media.narrow]: '17px' },
		transform: 'translateY(-18px)',
	},
	criticalTitle: { fill: color['--accent'] },
	noteDetail: {
		fill: color['--muted'],
		font: `12px ${font['--sans']}`,
		fontSize: { default: null, [media.narrow]: '15px' },
		transform: 'translateY(-18px)',
	},
	stationTitle: {
		fill: color['--ink'],
		font: `500 17px ${font['--sans']}`,
		fontSize: {
			default: null,
			[media.narrow]: '21px',
			[media.phone]: '28px',
		},
		letterSpacing: '-.02em',
		transform: { default: null, [media.phone]: 'translateY(211px)' },
	},
	stationDetail: {
		fill: color['--muted'],
		font: `12px ${font['--sans']}`,
		display: { default: null, [media.narrow]: 'none' },
	},
	sourceStation: { translate: { default: null, [media.phone]: '64px 52px' } },
	verdictStation: {
		translate: { default: null, [media.phone]: '-64px 52px' },
	},
	loopLabel: {
		fill: color['--muted'],
		font: `10px ${font['--mono']}`,
		letterSpacing: '.09em',
		display: { default: null, [media.phone]: 'none' },
	},
	accepted: {
		'--leaf-fill': color['--mint'],
		'--leaf-side': color['--iso-mint-side'],
		'--leaf-border': color['--green'],
		'--code-accent': color['--green'],
	},
	sealEllipse: { fill: color['--mint'], stroke: color['--green'] },
	signal: {
		'--signal-size': '16px',
		stroke: color['--signal'],
		strokeWidth: 2,
		strokeDasharray:
			'var(--signal-size) calc(var(--route-length) + var(--signal-size))',
		strokeDashoffset: 'var(--signal-size)',
		opacity: 0,
	},
	signalOut: { stroke: color['--green'] },
	signalReturn: { '--signal-size': '28px', strokeWidth: 1.6 },
})
