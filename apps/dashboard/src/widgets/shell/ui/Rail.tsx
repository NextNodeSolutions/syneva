import { useProjects } from '@entities/project/api/use-projects'
import {
	isProjectPath,
	projectPath,
} from '@entities/project/model/project-path'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import * as stylex from '@stylexjs/stylex'
import { fullName } from '@syneva/contracts/projects'

import { Brand } from './Brand'
import { NavList } from './NavList'
import { rail } from './rail.styles'
import { RailEntry } from './RailEntry'
import { sidebar } from './sidebar.styles'

import type { ReactElement } from 'react'

export function Rail({ pathname }: { pathname: string }): ReactElement {
	const { data } = useProjects()
	return (
		<aside {...stylex.props(sidebar.sidebar)}>
			<div {...stylex.props(sidebar.bar, rail.bar)}>
				<Brand />
			</div>
			<nav aria-label="Main" {...stylex.props(sidebar.nav, rail.nav)}>
				<NavList>
					<RailEntry
						to={PAGE_ROUTES.dashboard}
						icon="desk"
						label="Dashboard"
						isCurrent={pathname === PAGE_ROUTES.dashboard}
					/>
					<RailEntry
						to={PAGE_ROUTES.settings}
						icon="agent"
						label="Settings"
						isCurrent={pathname === PAGE_ROUTES.settings}
					/>
				</NavList>
				<NavList>
					{data?.projects.map(({ project }) => (
						<RailEntry
							key={projectPath(project)}
							to={projectPath(project)}
							icon="branch"
							label={fullName(project)}
							isCurrent={isProjectPath(project, pathname)}
						/>
					))}
				</NavList>
			</nav>
		</aside>
	)
}
