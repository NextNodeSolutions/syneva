import { usePathname } from '@shared/router/use-pathname'
import { isReviewPath } from '@shared/routes/is-review-path'
import * as stylex from '@stylexjs/stylex'

import { Rail } from './Rail'
import { shell } from './shell.styles'
import { Sidebar } from './Sidebar'

import type { ReactElement, ReactNode } from 'react'

// A review needs the width for its tree and diff, so the sidebar folds to a rail there.
export function Shell({ children }: { children: ReactNode }): ReactElement {
	const pathname = usePathname()
	const isDesk = isReviewPath(pathname)
	return (
		<div {...stylex.props(shell.frame, isDesk && shell.deskFrame)}>
			{isDesk ? (
				<Rail pathname={pathname} />
			) : (
				<Sidebar pathname={pathname} />
			)}
			<main key={pathname} {...stylex.props(shell.page)}>
				{children}
			</main>
		</div>
	)
}
