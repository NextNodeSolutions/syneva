import * as stylex from '@stylexjs/stylex'

// The verdict bar Pierre hangs on a pending change (or on the thread that
// covers one): Undo and Keep, pinned to the annotation's top-right corner over
// the line it decides.
export const verdict = stylex.create({
	bar: {
		position: 'absolute',
		top: '4px',
		right: '8px',
		zIndex: 4,
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		width: 'max-content',
	},
})
