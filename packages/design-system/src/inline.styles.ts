import * as stylex from '@stylexjs/stylex'

import { textLinkMarker } from './controls.stylex'
import { color, font } from './tokens.stylex'
import { transition } from './transitions.stylex'

// Focusable but carries no ring of its own: in the apps compose it right after focus.ring
// (controls.styles); the site's document rings focusables outside the recipes one by one.

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
	onWash: {
		textDecorationColor: {
			default: color['--accent-line'],
			':hover': color['--accent'],
		},
	},
	arrow: {
		display: 'inline-block',
		textDecorationLine: 'none',
		transition: `transform ${transition.fast}`,
		transform: { default: null, [textLinkHover()]: 'translateX(3px)' },
	},
})

export const code = stylex.create({
	base: {
		fontFamily: font['--mono'],
		fontSize: '.87em',
		paddingBlock: '1px',
		paddingInline: '5px',
		backgroundColor: color['--wash'],
		color: color['--ink'],
		whiteSpace: 'nowrap',
	},
	onPaper: { backgroundColor: color['--paper'] },
})

// A key hint: set in the sans, not the mono - Geist Mono lacks the key symbols (⇧ ⌘ ↵ and arrows),
// which fall back to shrunken system glyphs. Never takes its control's click; onFill and onTint
// draw the cap's rule from the control's text colour.
export const kbd = stylex.create({
	base: {
		boxSizing: 'border-box',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: '18px',
		height: '18px',
		paddingInline: '4px',
		fontFamily: font['--sans'],
		fontSize: '10.5px',
		fontWeight: 500,
		lineHeight: 1,
		color: color['--muted'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		pointerEvents: 'none',
	},
	onFill: {
		color: 'inherit',
		backgroundColor: 'transparent',
		borderColor: 'color-mix(in srgb, currentColor 38%, transparent)',
	},
	onTint: {
		color: 'inherit',
		backgroundColor: 'transparent',
		borderColor: 'color-mix(in srgb, currentColor 30%, transparent)',
	},
})
