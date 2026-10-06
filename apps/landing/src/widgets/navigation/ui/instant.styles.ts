import * as stylex from '@stylexjs/stylex'

import { navMarker } from './markers.stylex'

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', navMarker)

// Keyboard navigation is instant: every transition inside the header drops its duration and delay while the last input was a key.
export const instant = stylex.create({
	transitions: {
		transitionDuration: { default: null, [keyboard()]: '0s !important' },
		transitionDelay: { default: null, [keyboard()]: '0s !important' },
	},
})
