import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { duration, ease } from '@syneva/design-system/tokens.stylex'

import { deskRowMarker } from './desk-row.stylex'

// The link inside the row holds keyboard focus.
const FOCUSED = ':has(a:focus-visible)'
const SLID = '10px 0'

const rowHover = (): string => stylex.when.ancestor(':hover', deskRowMarker)
const rowFocus = (): string => stylex.when.ancestor(FOCUSED, deskRowMarker)

// A desk row's content slides 10px in while the row is hovered (on a fine pointer) or its link
// focused. It moves by `translate`, never by the row's padding: a padding narrows the grid's
// tracks, re-wraps the text and moves every row below. The desk cell itself never moves (the
// link's span stretched over the row is placed against the row, and a transformed box on its
// way would capture it): its title's text and its meta line do.
export const deskSlide = stylex.create({
	part: {
		translate: {
			default: null,
			[rowFocus()]: SLID,
			[media.finePointer]: {
				default: null,
				[rowHover()]: SLID,
				[rowFocus()]: SLID,
			},
		},
		transition: `translate ${duration['--duration-shift']} ${ease['--ease-out']}`,
	},
	// A run of text takes a transform only as an inline block.
	text: { display: 'inline-block', maxWidth: '100%' },
})
