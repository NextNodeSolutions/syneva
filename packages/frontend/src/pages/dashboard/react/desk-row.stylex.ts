import * as stylex from '@stylexjs/stylex'

export const deskRowMarker = stylex.defineMarker()

export const deskLinkMarker = stylex.defineMarker()

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
