import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskLinkMarker } from './desk-row.stylex'

const linkFocus = (): string =>
	stylex.when.ancestor(':focus-visible', deskLinkMarker)

// The desk cell: the session as the row's title and link, the mode and age under it in mono.
export const deskCell = stylex.create({
	cell: { gridArea: 'desk', minWidth: 0 },
	title: {
		fontSize: { default: '17px', [media.phone]: '16px' },
		fontWeight: 500,
		letterSpacing: '-.015em',
		lineHeight: 1.3,
		overflowWrap: 'anywhere',
	},
	link: {
		color: color['--ink'],
		outlineStyle: { default: null, ':focus-visible': 'none' },
	},
	// Spread over the row (its containing block is the row), so the whole row is the link
	// and the link's focus ring frames it, drawn inside so the row's neighbours never clip it.
	stretch: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		outlineWidth: { default: null, [linkFocus()]: '2px' },
		outlineStyle: { default: null, [linkFocus()]: 'solid' },
		outlineColor: color['--accent'],
		outlineOffset: '-2px',
	},
	// A run (shared/ui/run.styles): it breaks only between its parts.
	meta: {
		marginTop: '5px',
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		lineHeight: 1.45,
		color: color['--muted'],
	},
	metaMode: { color: color['--ink'] },
})
