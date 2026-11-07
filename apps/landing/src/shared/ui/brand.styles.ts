import * as stylex from '@stylexjs/stylex'

import { inputMarker } from './brand.stylex'

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', inputMarker)

// Operated from the keyboard, the mark skips its hover turn; its group can still dial independently.
export const brandInput = stylex.create({
	mark: {
		transitionDuration: { default: null, [keyboard()]: '0s !important' },
		transitionDelay: { default: null, [keyboard()]: '0s !important' },
	},
	dial: { transformBox: 'fill-box', transformOrigin: 'center' },
})
