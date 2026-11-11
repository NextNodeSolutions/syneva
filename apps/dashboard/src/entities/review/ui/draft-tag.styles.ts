import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const draftTag = stylex.create({
	tag: {
		color: color['--muted'],
		backgroundColor: color['--field'],
	},
})
