import * as stylex from '@stylexjs/stylex'

import { color } from './tokens.stylex'

// A point under its own strong rule, an accent square sitting on the rule's
// start (the site's steps and facts, the hub's register). Each list keeps
// its own padding.
export const ruledItem = stylex.create({
	base: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line-strong'],
		position: 'relative',
		'::before': {
			content: "''",
			position: 'absolute',
			top: '-3.5px',
			left: 0,
			width: '7px',
			height: '7px',
			backgroundColor: color['--accent'],
		},
	},
})
