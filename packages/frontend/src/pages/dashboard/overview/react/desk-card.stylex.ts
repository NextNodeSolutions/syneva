import * as stylex from '@stylexjs/stylex'

// A board card: its Open arrow steps forward while the card is hovered.
export const deskCardMarker = stylex.defineMarker()

// A board card's link: the span stretched over the card draws the focus ring while the link
// holds keyboard focus, so the ring frames the whole card.
export const cardLinkMarker = stylex.defineMarker()
