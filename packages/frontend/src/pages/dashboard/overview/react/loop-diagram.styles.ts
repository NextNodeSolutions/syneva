import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The review loop at rest, the empty overview's picture: the circuit band's drawing (ruled
// stations on the grid field, the petrol route, the dotted return: circuit-route.tsx) at a
// reading size, each station saying what happens there. The reviewer's own station sits on the
// palest petrol, as it does when desks wait there.
const PHONE = media.stacked
const ROUTE = '56px'
const ROUTE_PHONE = '18px'

export const loopDiagram = stylex.create({
	figure: {
		boxSizing: 'border-box',
		width: '100%',
		maxWidth: '680px',
		margin: 0,
		paddingTop: { default: '28px', [PHONE]: '18px' },
		paddingBottom: { default: '18px', [PHONE]: '16px' },
		paddingInline: { default: '28px', [PHONE]: '12px' },
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		textAlign: 'left',
	},
	stations: {
		display: 'grid',
		gridTemplateColumns: {
			default: `minmax(0, 1fr) ${ROUTE} minmax(0, 1fr) ${ROUTE} minmax(0, 1fr)`,
			[PHONE]: `minmax(0, 1fr) ${ROUTE_PHONE} minmax(0, 1fr) ${ROUTE_PHONE} minmax(0, 1fr)`,
		},
		alignItems: 'stretch',
	},
	station: {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		minWidth: 0,
		paddingBlock: { default: '13px', [PHONE]: '10px' },
		paddingInline: { default: '14px', [PHONE]: '9px' },
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
	},
	stationYou: {
		backgroundColor: color['--wash-tint'],
		borderColor: color['--accent-line'],
	},
	// On a phone's narrow station the label may take two lines, its square on the first.
	label: {
		display: 'flex',
		alignItems: { default: 'center', [PHONE]: 'flex-start' },
		gap: { default: '8px', [PHONE]: '6px' },
		fontFamily: font['--mono'],
		fontSize: { default: '10.5px', [PHONE]: '10px' },
		lineHeight: 1.4,
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		whiteSpace: { default: 'nowrap', [PHONE]: 'normal' },
		color: color['--muted'],
	},
	labelDot: { marginTop: { default: 0, [PHONE]: '3px' } },
	labelYou: { color: color['--accent'] },
	caption: {
		fontSize: { default: '12.5px', [PHONE]: '11.5px' },
		lineHeight: 1.4,
		color: color['--ink'],
		textWrap: 'pretty',
	},
	route: { paddingInline: { default: '8px', [PHONE]: '2px' } },
	// The way back, from Sent's foot round to the agent's: its ends on the outer stations'
	// centre lines (a station is a third of the row less the two routes).
	back: {
		height: { default: '20px', [PHONE]: '14px' },
		marginInline: {
			default: `calc((100% - 2 * ${ROUTE}) / 6)`,
			[PHONE]: `calc((100% - 2 * ${ROUTE_PHONE}) / 6)`,
		},
	},
})
