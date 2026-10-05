import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

const flash = stylex.keyframes({
	'0%': {
		backgroundColor: `color-mix(in srgb, ${color['--amber']} 22%, transparent)`,
	},
	'100%': { backgroundColor: 'transparent' },
})

// A thread jumped to from the blockers list or the notes panel (the
// file-comment section's or the unanchored strip's): an amber wash that fades
// out, so the eye lands on it.
export const jump = stylex.create({
	flash: {
		animationName: flash,
		animationDuration: '1.2s',
		animationTimingFunction: 'ease-out',
	},
})
