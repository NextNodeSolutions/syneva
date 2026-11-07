import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const projectName = stylex.create({
	name: {
		minWidth: 0,
		overflowWrap: 'anywhere',
	},
	owner: {
		color: color['--muted'],
	},
})
