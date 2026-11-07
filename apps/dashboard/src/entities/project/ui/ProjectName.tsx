import * as stylex from '@stylexjs/stylex'

import { projectName } from './project-name.styles'

import type { ProjectRef } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function ProjectName({
	project,
}: {
	project: ProjectRef
}): ReactElement {
	return (
		<span {...stylex.props(projectName.name)}>
			<span {...stylex.props(projectName.owner)}>{project.owner}/</span>
			{project.repo}
		</span>
	)
}
