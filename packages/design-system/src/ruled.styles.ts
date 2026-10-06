import * as stylex from '@stylexjs/stylex'

import { color } from './tokens.stylex'

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
