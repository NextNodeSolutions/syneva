import * as stylex from '@stylexjs/stylex'

import { inputMarker } from './brand.stylex'

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', inputMarker)

// The site's own addition to the shared wordmark (@syneva/design-system/
// brand.styles): operated from the keyboard, the mark skips its turn.
export const brandInput = stylex.create({
	mark: {
		transitionDuration: { default: null, [keyboard()]: '0s !important' },
		transitionDelay: { default: null, [keyboard()]: '0s !important' },
	},
})
