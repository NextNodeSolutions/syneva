import { usePathname } from '@shared/router/use-pathname'
import * as stylex from '@stylexjs/stylex'

import { shell } from './shell.styles'
import { Sidebar } from './Sidebar'

import type { ReactElement, ReactNode } from 'react'

export function Shell({ children }: { children: ReactNode }): ReactElement {
	const pathname = usePathname()
	return (
		<div {...stylex.props(shell.frame)}>
			<Sidebar pathname={pathname} />
			<main key={pathname} {...stylex.props(shell.page)}>
				{children}
			</main>
		</div>
	)
}
