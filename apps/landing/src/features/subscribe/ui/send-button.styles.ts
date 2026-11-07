import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { font } from '@syneva/design-system/tokens.stylex'

const turn = stylex.keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

// What a native <button> needs on top of the site's primary button (shared/ui/button.styles), an <a>.
export const sendButton = stylex.create({
	native: {
		flexShrink: 0,
		fontFamily: font['--sans'],
		cursor: {
			default: 'pointer',
			':is([aria-disabled="true"])': 'progress',
		},
	},
	// While the signup is on its way the mark turns in the arrow's place, as the header's does with the scroll.
	turning: {
		animationName: { default: null, [media.motionSafe]: turn },
		animationDuration: '1.4s',
		animationTimingFunction: 'linear',
		animationIterationCount: 'infinite',
	},
})
