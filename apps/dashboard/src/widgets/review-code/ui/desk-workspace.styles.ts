import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

// Under the tablet width the tree leaves the grid for a drawer, so the diff takes the whole row.
export const deskWorkspace = stylex.create({
	grid: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: {
			default: 'var(--tree-width) 1px minmax(0, 1fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gridTemplateRows: 'minmax(0, 1fr)',
		minWidth: 0,
		minHeight: 0,
	},
	treeWidth: (width: string) => ({ '--tree-width': width }),
})
