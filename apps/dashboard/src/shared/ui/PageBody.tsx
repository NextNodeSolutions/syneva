import * as stylex from '@stylexjs/stylex'

import { page } from './page.styles'

import type { ReactElement, ReactNode } from 'react'

export function PageBody({ children }: { children: ReactNode }): ReactElement {
	return <div {...stylex.props(page.inset, page.body)}>{children}</div>
}
