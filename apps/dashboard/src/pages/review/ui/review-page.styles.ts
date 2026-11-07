import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const reviewPage = stylex.create({
	projectLink: {
		color: { default: null, ':hover': color['--accent'] },
		transition: `color ${transition.fast}`,
	},
})
