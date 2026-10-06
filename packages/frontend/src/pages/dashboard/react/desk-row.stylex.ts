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
	// The row lays itself out by the width of the listing it sits in (its container), not the
	// window's: beside the sidebar and the journal a wide window can still give it a narrow
	// column. The listing names itself `desks` (a containerType inline-size element).
	// One line per desk down to a 640px listing (the overview's column beside the journal at a
	// 1280px window holds it), two lines below, stacked on the narrowest. The ranges do not
	// overlap: StyleX does not order container queries the way it orders media queries, so a
	// width that matched two of them could take either.
	narrow: '@container desks (min-width: 441px) and (max-width: 640px)',
	stackedWidth: '@container desks (max-width: 440px)',
	// The row's end has fixed tracks at full width (Close, then Open), which an armed close's
	// pair (Close desk and Keep) spans whole: arming never moves the columns before them.
	wide: '22px minmax(0, 1.1fr) minmax(0, 1.4fr) minmax(0, 1.1fr) 60px 58px',
	tablet: '22px minmax(0, 1fr) minmax(0, 1.15fr) auto',
	stacked: '20px minmax(0, 1fr) auto',
	gap: '18px',
	endInset: '8px',
})
