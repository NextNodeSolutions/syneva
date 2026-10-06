import * as stylex from '@stylexjs/stylex'

import { sheet } from './signup.stylex'

export const launchForm = stylex.create({
	foot: {
		paddingTop: '20px',
		paddingBottom: '6px',
		paddingInline: sheet.inset,
	},
	send: { width: '100%' },
})
