import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const SHADE = `color-mix(in srgb, ${color['--ink']} 14%, transparent)`
const COVER = color['--white']

// Diagrams are inline SVG from typed data on the design tokens: shapes and words carry the meaning (a linked element is outlined in petrol and says it opens code), never the hue alone. The diagram scrolls inside its block; the desk never grows sideways for it.
export const diagram = stylex.create({
	// A diagram wider than its block scrolls sideways under a shade at the edge it continues past: the covers scroll with the content and hide the shade once that edge is reached, so the overflow shows without a scrollbar.
	frame: {
		position: 'relative',
		maxHeight: '360px',
		overflow: 'auto',
		padding: '8px',
		backgroundImage: `linear-gradient(to right, ${COVER} 30%, transparent), linear-gradient(to left, ${COVER} 30%, transparent), linear-gradient(to right, ${SHADE}, transparent), linear-gradient(to left, ${SHADE}, transparent)`,
		backgroundPosition:
			'left center, right center, left center, right center',
		backgroundSize: '40px 100%, 40px 100%, 14px 100%, 14px 100%',
		backgroundRepeat: 'no-repeat',
		backgroundAttachment: 'local, local, scroll, scroll',
	},
	svg: {
		display: 'block',
		maxWidth: 'none',
		fontFamily: font['--sans'],
	},
	nodeShape: {
		fill: color['--white'],
		stroke: color['--line-strong'],
		strokeWidth: 1,
	},
	nodeText: { fill: color['--ink'], fontSize: '11px' },
	// The focused control is the <g> or <text> itself, not its shape: the desk's focus ring (desk.css) draws around it, so none is removed here.
	linked: { cursor: 'pointer' },
	linkedShape: {
		stroke: color['--accent'],
		fill: {
			default: color['--white'],
			':hover': color['--wash'],
		},
	},
	linkedText: { fill: color['--accent'] },
	initialShape: { stroke: color['--ink'], strokeWidth: 2 },
	finalShape: { strokeDasharray: '3 2' },
	unresolvedShape: { strokeDasharray: '4 3', stroke: color['--amber-line'] },
	edgePath: {
		stroke: color['--line-strong'],
		fill: 'none',
		strokeWidth: 1.2,
	},
	edgeLinked: { stroke: color['--accent'] },
	// A halo in the frame's colour keeps a label legible where it meets a line.
	edgeText: {
		fill: color['--muted'],
		fontSize: '10px',
		paintOrder: 'stroke',
		stroke: color['--white'],
		strokeWidth: 3,
		strokeLinejoin: 'round',
	},
	edgeTextLinked: { fill: color['--accent'], textDecoration: 'underline' },
	lifeline: { stroke: color['--line'], strokeDasharray: '3 3' },
	entityHead: { fill: color['--field'] },
	entityName: { fill: color['--ink'], fontSize: '11.5px', fontWeight: 600 },
	entityChange: { fontSize: '9.5px', fontFamily: font['--mono'] },
	fieldSign: {
		fontSize: '11px',
		fontWeight: 700,
		fontFamily: font['--mono'],
	},
	fieldName: {
		fill: color['--ink'],
		fontSize: '11px',
		fontFamily: font['--mono'],
	},
	fieldType: {
		fill: color['--muted'],
		fontSize: '10.5px',
		fontFamily: font['--mono'],
	},
	struck: { textDecoration: 'line-through' },
	marker: { fill: color['--line-strong'] },
	textEquivalent: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	textSummary: {
		paddingBlock: '6px',
		paddingInline: '10px',
		cursor: 'pointer',
		fontSize: '11px',
		color: color['--muted'],
	},
	textList: {
		marginBlock: 0,
		marginInline: 0,
		paddingTop: 0,
		paddingBottom: '8px',
		paddingLeft: '26px',
		paddingRight: '10px',
		fontSize: '11.5px',
		lineHeight: 1.6,
		color: color['--ink'],
	},
})
