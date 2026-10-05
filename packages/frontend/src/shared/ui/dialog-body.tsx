import * as stylex from '@stylexjs/stylex'

import { dialog } from './dialog.styles'

import type { ReactElement, ReactNode } from 'react'

// A dialog's content under its bar: the part that scrolls when the sheet
// outgrows the viewport, so the bar and the footer stay in reach.
export function DialogBody({
	children,
}: {
	children: ReactNode
}): ReactElement {
	return <div {...stylex.props(dialog.body)}>{children}</div>
}
