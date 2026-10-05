import * as stylex from '@stylexjs/stylex'

// Links whose arrow moves when the link is hovered (a text link carries the
// design system's textLinkMarker).
export const buttonMarker = stylex.defineMarker()
// Rows the actions size themselves to: a page's actions row (the commands
// and text links in it share the row) and a chapter's copy column (links
// inside it sit a step lower on subpages). The widgets apply them.
export const pageActionsMarker = stylex.defineMarker()
export const chapterCopyMarker = stylex.defineMarker()
