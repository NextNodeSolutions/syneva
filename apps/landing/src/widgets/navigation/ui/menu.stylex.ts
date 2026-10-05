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

// The row under the pointer lifts off the panel: a hairline edge and a soft
// two-step shadow, the dropdown's own elevation at the scale of a row. The
// product rows share one lifted card that slides between them
// (panel.styles.ts); the other rows lift on their own (menu.styles.ts).
// Its three layers are the edge, the contact shadow under the row and the
// soft cast below it. defineConsts takes literals only: the palette's
// variables keep their literal names, so the shadow names --ink itself.
const EDGE = 'color-mix(in srgb, var(--ink) 8%, transparent)'
const CONTACT = 'color-mix(in srgb, var(--ink) 6%, transparent)'
const CAST = 'color-mix(in srgb, var(--ink) 20%, transparent)'
export const menuElevation = stylex.defineConsts({
	raised: `0 0 0 1px ${EDGE}, 0 1px 2px ${CONTACT}, 0 8px 18px -8px ${CAST}`,
})
