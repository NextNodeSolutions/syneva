import * as stylex from '@stylexjs/stylex'

// Every dashboard page's root: the `page` container its parts lay out against (the overview's
// journal beside its list, a section's two columns), at least the column's height.
export const dashboardPage = stylex.create({
	root: {
		containerType: 'inline-size',
		containerName: 'page',
		minHeight: '100%',
	},
})
