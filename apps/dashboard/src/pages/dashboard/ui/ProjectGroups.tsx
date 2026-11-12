import { useProjects } from '@entities/project/api/use-projects'
import { projectPath } from '@entities/project/model/project-path'
import { AppLink } from '@shared/router/AppLink'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import { QueryStatus } from '@shared/ui/QueryStatus'
import { StatusMessage } from '@shared/ui/StatusMessage'
import * as stylex from '@stylexjs/stylex'
import { ProjectGroup } from '@widgets/project-group/ui/ProjectGroup'

import { projectGroups } from './project-groups.styles'

import type { ReactElement } from 'react'

export function ProjectGroups(): ReactElement {
	const projects = useProjects()
	if (!projects.isSuccess)
		return (
			<QueryStatus
				error={projects.error}
				pendingTitle="Loading projects…"
				errorTitle="Projects did not load."
			/>
		)
	if (!projects.data.projects.length)
		return (
			<StatusMessage title="No projects selected.">
				<AppLink to={PAGE_ROUTES.settings}>
					Connect GitHub and choose projects in Settings.
				</AppLink>
			</StatusMessage>
		)
	return (
		<div {...stylex.props(projectGroups.groups)}>
			{projects.data.projects.map(({ project, reviews }) => (
				<ProjectGroup
					key={projectPath(project)}
					project={project}
					reviews={reviews}
				/>
			))}
		</div>
	)
}
