import * as stylex from '@stylexjs/stylex'

// One spacing system for every menu: the same inset around the link area and
// the same padding inside each link, so content sits on the same lines
// whichever menu the shell morphs to, and the footer text lines up with the
// link content above it. A whole-pixel title line keeps every row a whole
// number of pixels, so the preview highlight (placed from offsetTop and
// offsetHeight) and the shell height (rounded up) land exactly on the rows.
// The title line is a custom property so its ratio stays unrounded (a literal
// calc() would be folded to five decimals and lose the whole pixel).
export const menuSpacing = stylex.defineConsts({
	inset: '8px',
	linkPadding: '14px 12px',
	icon: '20px',
	iconGap: '13px',
	titleLine: 'var(--menu-title-line)',
})
