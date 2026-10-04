import * as stylex from '@stylexjs/stylex'

// Numbered points, each under its own rule with an accent square.
export const ruledList = stylex.create({
	root: {
		listStyle: 'none',
		margin: 0,
		padding: 0,
		display: 'grid',
		gridTemplateColumns: '1fr',
		gap: '0 32px',
	},
	item: { padding: '20px 0 26px' },
	index: { marginBottom: '12px' },
	head: {
		display: 'block',
		fontSize: '16px',
		fontWeight: 500,
		marginBottom: '6px',
	},
	text: { fontSize: '14px' },
})
