import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// The review circuit at the head of the overview: the landing's drawing put to work on the
// ruled grid. Three ruled stations joined by the petrol route, the dotted return of the next
// round under them; one square per desk at the station whose turn it is.
const ROUTE = '72px'
// On a phone the stations keep their squares and a short route, so a desk's travel still reads.
const ROUTE_PHONE = '16px'
const PHONE = media.stacked

export const circuit = stylex.create({
	band: {
		position: 'relative',
		paddingTop: { default: '26px', [PHONE]: '16px' },
		paddingBottom: { default: '14px', [PHONE]: '16px' },
		paddingInline: { default: '32px', [PHONE]: '16px' },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	stations: {
		display: 'grid',
		gridTemplateColumns: {
			default: `minmax(0, 1fr) ${ROUTE} minmax(0, 1fr) ${ROUTE} minmax(0, 1fr)`,
			[PHONE]: `minmax(0, 1fr) ${ROUTE_PHONE} minmax(0, 1fr) ${ROUTE_PHONE} minmax(0, 1fr)`,
		},
	},
	station: {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		gap: '6px',
		minWidth: 0,
		minHeight: { default: '124px', [PHONE]: '0' },
		paddingBlock: { default: '14px', [PHONE]: '10px' },
		paddingInline: { default: '16px', [PHONE]: '10px' },
		textAlign: 'left',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		color: color['--ink'],
		cursor: 'pointer',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			[media.finePointer]: {
				default: color['--line-strong'],
				':hover': color['--accent'],
			},
		},
		transition: `background-color ${transition.fast}, border-color ${transition.fast}`,
	},
	// The reviewer's own station, while desks wait there: on the palest petrol (the board's
	// column of the same turn), so the eye lands on it before anything is chosen.
	stationWaiting: {
		backgroundColor: color['--wash-tint'],
		borderColor: {
			default: color['--accent-line'],
			[media.finePointer]: {
				default: color['--accent-line'],
				':hover': color['--accent'],
			},
		},
	},
	stationOn: {
		backgroundColor: color['--wash'],
		borderColor: {
			default: color['--accent'],
			[media.finePointer]: {
				default: color['--accent'],
				':hover': color['--accent'],
			},
		},
	},
	label: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	countRow: {
		display: 'flex',
		alignItems: 'baseline',
		flexWrap: 'wrap',
		columnGap: '10px',
	},
	count: {
		fontSize: { default: '40px', [PHONE]: '28px' },
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1,
		fontVariantNumeric: 'tabular-nums',
	},
	countZero: { color: color['--line-strong'] },
	phrase: {
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
		display: { default: 'inline', [PHONE]: 'none' },
	},
	tokens: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '5px',
		minHeight: '9px',
		marginTop: 'auto',
	},
	token: {
		display: 'block',
		width: '9px',
		height: '9px',
		backgroundColor: color['--accent'],
	},
	tokenWorking: { backgroundColor: color['--signal'] },
	tokenSent: {
		backgroundColor: color['--white'],
		boxShadow: `inset 0 0 0 1.5px ${color['--accent']}`,
	},
	more: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		lineHeight: '9px',
		color: color['--muted'],
	},
	// The route between two stations (circuit-route.tsx draws it).
	route: { paddingInline: { default: '10px', [PHONE]: '2px' } },
})
