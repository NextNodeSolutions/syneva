import * as stylex from '@stylexjs/stylex'

// One spacing system for every menu, so content sits on the same lines whichever menu the shell morphs to.
// A whole-pixel title line keeps every row a whole number of pixels (the preview highlight from offsetTop/offsetHeight and the shell height land exactly on rows); it is a custom property because a literal calc() would fold to five decimals and lose the whole pixel.
export const menuSpacing = stylex.defineConsts({
	inset: '8px',
	linkPadding: '14px 12px',
	icon: '20px',
	iconGap: '13px',
	titleLine: 'var(--menu-title-line)',
})

// defineConsts takes literals only: the palette's variables keep their literal names, so the shadow names --ink itself.
const EDGE = 'color-mix(in srgb, var(--ink) 8%, transparent)'
const CONTACT = 'color-mix(in srgb, var(--ink) 6%, transparent)'
const CAST = 'color-mix(in srgb, var(--ink) 20%, transparent)'
export const menuElevation = stylex.defineConsts({
	raised: `0 0 0 1px ${EDGE}, 0 1px 2px ${CONTACT}, 0 8px 18px -8px ${CAST}`,
})
