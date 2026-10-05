import * as stylex from '@stylexjs/stylex'

// The verdict bar Pierre hangs on a pending change (or on the thread that
// covers one): Undo and Keep. On a bare change it is pinned to the
// annotation's top-right corner over the line it decides; above a thread it
// sits in flow, right-aligned, so it never covers the first message.
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
