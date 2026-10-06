import * as stylex from '@stylexjs/stylex'

// The hub shell's measures, shared by the dashboard's frame, the desk's rail and the desk's
// own layout beside it: the open sidebar, the rail it folds to, and the height of the bars
// that touch it (the sidebar's top, a page's head on phones), so their bottom rules read as
// one line across the seam.
export const shell = stylex.defineConsts({
	sidebarWidth: '232px',
	railWidth: '56px',
	// The desk's top bar height (deskSize.topbar), so the rail's top rule meets it.
	barHeight: '48px',
})
