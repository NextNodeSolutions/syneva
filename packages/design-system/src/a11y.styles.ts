import * as stylex from '@stylexjs/stylex'

export const a11y = stylex.create({
	// Read by screen readers, drawn nowhere.
	srOnly: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		margin: '-1px',
		overflow: 'hidden',
		clipPath: 'inset(50%)',
		whiteSpace: 'nowrap',
	},
})
