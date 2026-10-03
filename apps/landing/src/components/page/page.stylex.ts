import * as stylex from '@stylexjs/stylex'

// A page's actions row (the commands and text links in it size themselves
// to share the row), an index row and a pager link (their parts react to the
// whole row's hover).
export const pageActionsMarker = stylex.defineMarker()
export const indexRowMarker = stylex.defineMarker()
export const pagerLinkMarker = stylex.defineMarker()
