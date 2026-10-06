import * as stylex from '@stylexjs/stylex'

export const verdict = stylex.create({
	bar: {
		zIndex: 4,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: '4px',
	},
	pinned: {
		position: 'absolute',
		top: '4px',
		right: '8px',
		width: 'max-content',
	},
	aboveThread: {
		position: 'relative',
		paddingTop: '6px',
		paddingInline: '8px',
	},
})
