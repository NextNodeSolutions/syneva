import * as stylex from '@stylexjs/stylex'

import { dialog } from './dialog.styles'

import type { ReactElement, ReactNode } from 'react'

export function DialogFooter({
	children,
}: {
	children: ReactNode
}): ReactElement {
	return <div {...stylex.props(dialog.footer)}>{children}</div>
}
