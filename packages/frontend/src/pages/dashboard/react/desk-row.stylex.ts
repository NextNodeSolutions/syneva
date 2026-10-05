import * as stylex from '@stylexjs/stylex'

// A desk row: its icon and arrow turn while the row is hovered or its link has keyboard focus.
export const deskRowMarker = stylex.defineMarker()

// The row's link: the span stretched over the row draws the focus ring while the link holds
// keyboard focus, so the ring frames the whole row.
export const deskLinkMarker = stylex.defineMarker()

// The listing's column tracks, shared by the rows and the head above them, so the head's
// register starts on the rows' review column (their stage column from tablets down): icon,
// desk, stage, review, actions and arrow at full width; icon, desk, stage and arrow over two
// lines from tablets down; three stacked lines on phones. `endInset` is the rows' room at
// their end, where the arrow's +4px step stays clear of the focus ring.
export const deskGrid = stylex.defineConsts({
	wide: '24px minmax(0, 1.15fr) minmax(0, 1.35fr) minmax(0, 1fr) 148px 20px',
	tablet: '24px minmax(0, 1fr) minmax(0, 1.15fr) 20px',
	stacked: '20px minmax(0, 1fr) auto',
	gap: '20px',
	endInset: '8px',
})
