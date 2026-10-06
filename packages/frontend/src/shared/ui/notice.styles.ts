import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const notice = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: '8px minmax(0, 1fr)',
		columnGap: '12px',
		alignItems: 'start',
		paddingBlock: '14px',
		paddingLeft: '16px',
		paddingRight: '16px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
	},
	dismissible: {
		gridTemplateColumns: '8px minmax(0, 1fr) auto',
		paddingRight: '8px',
	},
	inkRule: { borderColor: color['--ink'] },
	redRule: { borderColor: color['--red-line'] },
	square: { width: '8px', height: '8px', marginTop: '6px' },
	petrol: { backgroundColor: color['--accent'] },
	green: { backgroundColor: color['--green'] },
	red: { backgroundColor: color['--red'] },
	neutral: { backgroundColor: color['--line-strong'] },
	lead: {
		marginBlock: 0,
		fontSize: '13.5px',
		fontWeight: 500,
		lineHeight: 1.45,
		color: color['--ink'],
	},
	rest: {
		marginTop: '2px',
		marginBottom: 0,
		fontSize: '13px',
		lineHeight: 1.45,
		color: color['--muted'],
		textWrap: 'balance',
	},
})
