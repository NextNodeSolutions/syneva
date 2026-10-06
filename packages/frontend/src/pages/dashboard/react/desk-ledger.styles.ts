import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The desks as a ruled ledger in groups (a turn's, a project's): each group under a strong
// rule with its name, its count and what it means. The ledger is the `desks` container its
// rows lay themselves out against (desk-row.stylex.ts).
export const deskLedger = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'desks',
	},
	group: { marginTop: '22px' },
	head: {
		display: 'flex',
		alignItems: 'baseline',
		flexWrap: 'wrap',
		columnGap: '10px',
		rowGap: '2px',
		paddingBottom: '10px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	dot: { alignSelf: 'center' },
	title: { fontSize: '15px', fontWeight: 500, letterSpacing: '-.01em' },
	count: {
		fontFamily: font['--mono'],
		fontSize: '12px',
		color: color['--muted'],
	},
	meta: {
		minWidth: 0,
		flex: '0 1 auto',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		direction: 'rtl',
		textAlign: 'left',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	note: {
		marginLeft: 'auto',
		fontSize: '12.5px',
		color: color['--muted'],
	},
	empty: {
		paddingBlock: '18px',
		fontSize: '13px',
		color: color['--muted'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
})
