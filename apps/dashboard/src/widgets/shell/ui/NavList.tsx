import * as stylex from '@stylexjs/stylex'

import { navList } from './nav-list.styles'

import type { ReactElement, ReactNode } from 'react'

export function NavList({ children }: { children: ReactNode }): ReactElement {
	return <ul {...stylex.props(navList.list)}>{children}</ul>
}
