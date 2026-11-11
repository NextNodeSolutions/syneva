import { useProjects } from '@entities/project/api/use-projects'
import { projectPath } from '@entities/project/model/project-path'
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
		return <StatusMessage title="No project yet." />
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
