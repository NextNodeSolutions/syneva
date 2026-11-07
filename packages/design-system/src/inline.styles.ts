import * as stylex from '@stylexjs/stylex'

import { textLinkMarker } from './inline.stylex'
import { color, font } from './tokens.stylex'
import { transition } from './transitions.stylex'

// Focusable but carries no ring of its own: the site's document rings focusables one by one.

const textLinkHover = (): string =>
	stylex.when.ancestor(':hover', textLinkMarker)

// The secondary action beside a primary one (there are no ghost buttons); its arrow reads
// the textLinkMarker the link carries.
export const textLink = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '12px',
		fontSize: '14px',
		color: { default: null, ':hover': color['--accent'] },
		textDecorationLine: 'underline',
		textDecorationThickness: '1px',
		textUnderlineOffset: '5px',
		textDecorationColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		transition: `color ${transition.fast}, text-decoration-color ${transition.fast}`,
	},
	small: { fontSize: '13px', textUnderlineOffset: '4px', gap: '8px' },
	arrow: {
		display: 'inline-block',
		textDecorationLine: 'none',
		transition: `transform ${transition.fast}`,
		transform: { default: null, [textLinkHover()]: 'translateX(3px)' },
	},
})

// A <button> that reads as text: the native control's box, border and fill taken away, its colour and type left to what it is composed with (in the site, after textLink).
export const textButton = stylex.create({
	base: {
		appearance: 'none',
		boxSizing: 'border-box',
		justifyContent: 'center',
		margin: 0,
		paddingBlock: 0,
		paddingInline: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		backgroundColor: 'transparent',
		fontFamily: font['--sans'],
		fontWeight: 400,
		lineHeight: 1.2,
		whiteSpace: 'nowrap',
		color: { default: color['--ink'], ':hover': color['--accent'] },
		cursor: { default: 'pointer', ':disabled': 'default' },
		opacity: { default: null, ':disabled': 0.55 },
		pointerEvents: { default: null, ':disabled': 'none' },
	},
})
