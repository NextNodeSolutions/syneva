import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The rendered markdown file: a centred reading column in place of the diff
// (its typography is data-prose="document", shared/markdown/prose.css). Every
// block that carries a source line takes a click to comment, washed in petrol
// under the pointer; its threads sit inline under the block, on white behind a
// petrol rule.
export const mdFile = stylex.create({
	document: {
		maxWidth: '760px',
		marginInline: 'auto',
		padding: '28px 32px 64px',
	},
	anchor: {
		cursor: 'pointer',
		transition: 'background-color .1s, box-shadow .1s',
		backgroundColor: { default: null, ':hover': color['--wash-tint'] },
		boxShadow: {
			default: null,
			':hover': `0 0 0 4px ${color['--wash-tint']}`,
		},
	},
	thread: {
		marginTop: '6px',
		marginBottom: '14px',
		backgroundColor: color['--white'],
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--accent-line'],
		cursor: 'default',
	},
	// Under a list item the thread tucks back toward the item's marker.
	threadInItem: { marginLeft: '-6px' },
})
