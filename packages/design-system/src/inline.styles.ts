import * as stylex from '@stylexjs/stylex'

import { textLinkMarker } from './controls.stylex'
import { color, font } from './tokens.stylex'
import { transition } from './transitions.stylex'

// What a front sets inside a line of text: the secondary link (the site's and
// the apps'), an inline command, a key hint. The link is focusable but carries
// no ring of its own: in the apps compose it after focus.ring
// (controls.styles), as every focusable outside the control recipes does; the
// site's document rings every focusable.

const textLinkHover = (): string =>
	stylex.when.ancestor(':hover', textLinkMarker)

// The secondary action beside a primary one, on the site and in the apps
// alike (there are no ghost buttons): an underlined link that takes its
// sentence's colour and turns petrol on hover, its arrow (a glyph after the
// label, reading the textLinkMarker the link carries) stepping forward.
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
	// On a wash band the resting underline takes petrol's rule tone.
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

// A command or a path quoted in prose: mono on the wash, never wrapped.
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
	// A code chip sitting on a wash band: the paper keeps it apart.
	onPaper: { backgroundColor: color['--paper'] },
})

// A key hint (a shortcut beside its action, "press ?"): a small white keycap
// under a strong rule. Set in the sans, not the mono: Geist Mono lacks the key
// symbols (⇧ ⌘ ↵ and the arrows), which would fall back to shrunken system
// glyphs. It never takes its control's click. On a solid fill (a primary
// action) or a tinted one, onFill and onTint drop the cap's own ground and draw
// its rule from the control's text colour instead.
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
