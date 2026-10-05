import * as stylex from '@stylexjs/stylex'

import { dialog } from './dialog.styles'

import type { ReactElement, ReactNode } from 'react'

// A dialog's actions under a rule, at the end of the row (the primary action
// last), at every width.
export function DialogFooter({
	children,
}: {
	children: ReactNode
}): ReactElement {
	return <div {...stylex.props(dialog.footer)}>{children}</div>
}
