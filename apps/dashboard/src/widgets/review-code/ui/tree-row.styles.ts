import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

import { deskText } from './desk.stylex'

const ROW_INSET = 8
const DEPTH_STEP = 14
const MARKER_WIDTH = 12
// Puts each rail under the chevron of the folder it belongs to.
const RAIL_OFFSET = 1

export const treeRow = stylex.create({
	row: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		width: '100%',
		minHeight: '26px',
		paddingBlock: 0,
		paddingRight: '8px',
		borderWidth: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.row,
		color: color['--ink'],
		textAlign: 'left',
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
		backgroundImage: `repeating-linear-gradient(to right, transparent 0 ${DEPTH_STEP - 1}px, ${color['--line']} ${DEPTH_STEP - 1}px ${DEPTH_STEP}px)`,
		backgroundPosition: `${RAIL_OFFSET}px 0`,
		backgroundRepeat: 'no-repeat',
		transition: `background-color ${transition.fast}`,
	},
	indent: (depth: number) => ({
		paddingLeft: `${ROW_INSET + depth * DEPTH_STEP}px`,
		backgroundSize: `${depth * DEPTH_STEP}px 100%`,
	}),
	active: {
		backgroundColor: color['--wash'],
		'::before': {
			content: '""',
			position: 'absolute',
			insetBlock: 0,
			left: 0,
			width: '2px',
			backgroundColor: color['--accent'],
		},
	},
	chevron: {
		width: `${MARKER_WIDTH}px`,
		height: `${MARKER_WIDTH}px`,
		color: color['--muted'],
		transition: `transform ${transition.fast}`,
	},
	chevronOpen: {
		transform: 'rotate(90deg)',
	},
	markerSpace: {
		flexShrink: 0,
		width: `${MARKER_WIDTH}px`,
	},
	folder: {
		color: color['--muted'],
	},
	name: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
})
