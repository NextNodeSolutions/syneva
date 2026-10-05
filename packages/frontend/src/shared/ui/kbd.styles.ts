import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

// The key hint every action carries, square like every control. Sans, not
// mono: key symbols (⇧ ⌘ ↵, arrows) are missing from the code faces, where they
// fall back to a shrunken system glyph; the sans stack ends in the system UI
// font, whose symbols sit at cap height. A chip never takes the click.
export const kbd = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		minWidth: '17px',
		height: '17px',
		paddingInline: '4px',
		fontFamily: font['--sans'],
		fontSize: deskText.label,
		fontWeight: 500,
		lineHeight: 1,
		fontVariantNumeric: 'tabular-nums',
		color: color['--muted'],
		backgroundColor: color['--paper'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		pointerEvents: 'none',
	},
	// On a solid fill (the petrol primary, a verdict) the chip takes the
	// label's own ink, ruled by a thinned copy of it.
	onFill: {
		color: 'inherit',
		backgroundColor: 'transparent',
		borderColor: 'color-mix(in srgb, currentColor 38%, transparent)',
	},
	// On a tinted control the chip sits on the tint, ruled by the tone.
	onTint: {
		color: 'inherit',
		backgroundColor: 'transparent',
		borderColor: 'color-mix(in srgb, currentColor 30%, transparent)',
	},
})
