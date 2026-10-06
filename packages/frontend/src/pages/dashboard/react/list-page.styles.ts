import * as stylex from '@stylexjs/stylex'

import { pageInset } from './page.stylex'

// A listing page's body under its head: the ledger and what follows it, inset like the head.
export const listPage = stylex.create({
	body: {
		paddingInline: pageInset.gutter,
		paddingBottom: '56px',
	},
})
