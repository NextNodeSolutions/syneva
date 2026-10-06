import * as stylex from '@stylexjs/stylex'

// Composed before a control's own styles, which may then draw one side (a field's bottom rule).
export const reset = stylex.create({
	// border: 0 resets style and colour too, not just the width.
	border: {
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
	},
})
