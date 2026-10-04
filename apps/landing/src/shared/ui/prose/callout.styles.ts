import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// A boxed aside with a coloured square: a lead line and its explanation;
// the aside keeps its distance from what precedes it in a prose body.
export const callout = stylex.create({
	root: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--white'],
		padding: '20px 22px',
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gap: '14px',
		fontSize: '14.5px',
		marginTop: { default: null, ':not(:first-child)': '32px' },
		'::before': {
			content: "''",
			width: '8px',
			height: '8px',
			marginTop: '8px',
		},
	},
	open: { '::before': { backgroundColor: color['--accent'] } },
	settled: { '::before': { backgroundColor: color['--green'] } },
	lead: { color: color['--ink'] },
	rest: { color: color['--muted'], marginTop: '6px' },
})
