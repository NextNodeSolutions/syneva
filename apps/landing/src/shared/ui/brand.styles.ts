import * as stylex from '@stylexjs/stylex'

import { inputMarker } from './brand.stylex'

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', inputMarker)

// The site's own additions to the shared wordmark (@syneva/design-system/
// brand.styles): operated from the keyboard, the mark skips its turn, and
// its group can dial independently of that turn.
export const brandInput = stylex.create({
	mark: {
		transitionDuration: { default: null, [keyboard()]: '0s !important' },
		transitionDelay: { default: null, [keyboard()]: '0s !important' },
	},
	// The mark's group turns about the mark's own centre.
	dial: { transformBox: 'fill-box', transformOrigin: 'center' },
})
