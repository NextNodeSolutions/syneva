import { useProjects } from '@entities/project/api/use-projects'
import {
	isProjectPath,
	projectPath,
} from '@entities/project/model/project-path'
import { ProjectName } from '@entities/project/ui/ProjectName'
import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { NavEntry } from './NavEntry'
import { NavList } from './NavList'
import { sidebar } from './sidebar.styles'

import type { ReactElement } from 'react'

export function ProjectEntries({
	pathname,
}: {
	pathname: string
}): ReactElement {
	const projects = useProjects()
	if (projects.isError)
		return (
			<p {...stylex.props(caption.base, sidebar.label)}>
				Projects did not load.
			</p>
		)
	return (
		<NavList>
			{projects.data?.projects.map(({ project, reviews }) => (
				<NavEntry
					key={projectPath(project)}
					to={projectPath(project)}
					icon="branch"
					isCurrent={isProjectPath(project, pathname)}
					count={reviews.length}
				>
					<ProjectName project={project} />
				</NavEntry>
			))}
		</NavList>
	)
}
