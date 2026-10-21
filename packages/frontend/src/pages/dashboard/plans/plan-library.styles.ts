import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskRowMarker } from '../react/desk-row.stylex'

// The library as index rows per repository: the plan's title, what it is about and its file,
// then its status, where its review stands, its versions and last move, and Review; on a narrow
// page the figures fold into one line under the title. A row is the shared index row
// (react/index-row.styles.ts), lit as a desk row is (rowLight), its title answering the row's
// hover through the desk row's marker.
const NARROW = '@container plans (max-width: 760px)'
const rowHover = (): string => stylex.when.ancestor(':hover', deskRowMarker)

export const planLibrary = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'plans',
		paddingTop: '28px',
	},
	project: { marginTop: { default: '26px', ':first-child': 0 } },
	projectHead: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '12px',
		paddingBottom: '10px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	projectName: { color: color['--ink'] },
	row: {
		gridTemplateColumns: {
			default:
				'minmax(0, 3fr) minmax(0, 0.8fr) minmax(0, 1.3fr) minmax(0, 1.1fr) auto',
			[NARROW]: 'minmax(0, 1fr) auto',
		},
		position: 'relative',
		paddingInline: '8px',
	},
	titleLink: {
		textDecoration: 'none',
		color: {
			default: color['--ink'],
			[media.finePointer]: {
				default: null,
				[rowHover()]: color['--accent'],
			},
		},
	},
	// The title's link covers the row, so the whole row opens the plan's page; Review sits above
	// it.
	stretch: { position: 'absolute', inset: 0 },
	summary: {
		display: 'block',
		marginTop: '3px',
		fontSize: '13px',
		lineHeight: 1.45,
		color: color['--muted'],
	},
	path: {
		display: 'block',
		marginTop: '4px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	figure: {
		display: { default: 'block', [NARROW]: 'none' },
		fontFamily: font['--mono'],
		fontSize: '13px',
		color: color['--muted'],
	},
	folded: {
		display: { default: 'none', [NARROW]: 'block' },
		gridColumn: '1 / -1',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	turn: {
		display: { default: 'grid', [NARROW]: 'none' },
		gap: '4px',
		fontSize: '13px',
	},
	turnLabel: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '8px',
		color: color['--ink'],
	},
	decided: {
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		color: color['--muted'],
	},
	action: {
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: '6px 10px',
	},
	failure: { fontSize: '12px', color: color['--red'] },
	empty: {
		fontSize: '14px',
		color: color['--muted'],
	},
})
