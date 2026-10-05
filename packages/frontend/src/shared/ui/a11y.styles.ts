import * as stylex from '@stylexjs/stylex'

// Text for screen readers only: a figure's words beside its aria-hidden glyph
// ("3 of 12" beside "3/12"), a link's "opens in a new tab". Clipped rather
// than hidden, so it stays in the accessibility tree.
export const a11y = stylex.create({
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
