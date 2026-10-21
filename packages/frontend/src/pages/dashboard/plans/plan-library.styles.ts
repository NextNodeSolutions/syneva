import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The library as index rows per repository: the plan's title, what it is about and its file,
// then its status, its versions and its last move; on a narrow page the figures fold into one
// line under the title.
const NARROW = '@container plans (max-width: 760px)'

export const planLibrary = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'plans',
	},
	project: { marginTop: '26px' },
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
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 3fr) repeat(3, minmax(0, 1fr)) 96px',
			[NARROW]: 'minmax(0, 1fr) auto',
		},
		alignItems: 'center',
		columnGap: '20px',
		rowGap: '6px',
		paddingBlock: '16px',
		paddingInline: '4px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	title: {
		display: 'block',
		fontSize: '15px',
		fontWeight: 500,
		letterSpacing: '-.01em',
		color: color['--ink'],
	},
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
	desk: { justifySelf: 'end' },
	// The desks above end where the library starts: one page bottom, under the library.
	flush: { paddingBottom: 0 },
	empty: {
		marginTop: '18px',
		fontSize: '14px',
		color: color['--muted'],
	},
})
