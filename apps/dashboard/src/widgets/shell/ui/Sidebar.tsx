import { useProjects } from '@entities/project/api/use-projects'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import * as stylex from '@stylexjs/stylex'
import { WORDMARK } from '@syneva/design-system/brand'
import { caption } from '@syneva/design-system/controls.styles'

import { Brand } from './Brand'
import { NavEntry } from './NavEntry'
import { NavList } from './NavList'
import { ProjectEntries } from './ProjectEntries'
import { sidebar } from './sidebar.styles'

import type { ReactElement } from 'react'

export function Sidebar({ pathname }: { pathname: string }): ReactElement {
	const { data } = useProjects()
	const openReviews = data?.projects.reduce(
		(total, { reviews }) => total + reviews.length,
		0,
	)
	return (
		<aside {...stylex.props(sidebar.sidebar)}>
			<div {...stylex.props(sidebar.bar)}>
				<Brand>{WORDMARK}</Brand>
			</div>
			<nav aria-label="Main" {...stylex.props(sidebar.nav)}>
				<NavList>
					<NavEntry
						to={PAGE_ROUTES.dashboard}
						icon="desk"
						isCurrent={pathname === PAGE_ROUTES.dashboard}
						count={openReviews}
					>
						Dashboard
					</NavEntry>
				</NavList>
				<div>
					<p
						{...stylex.props(
							caption.base,
							caption.upper,
							sidebar.label,
						)}
					>
						Projects
					</p>
					<ProjectEntries pathname={pathname} />
				</div>
			</nav>
		</aside>
	)
}
