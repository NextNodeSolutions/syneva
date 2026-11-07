import { projectPath } from '@entities/project/model/project-path'
import { ProjectName } from '@entities/project/ui/ProjectName'
import { ReviewList } from '@entities/review/ui/ReviewList'
import { AppLink } from '@shared/router/AppLink'
import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { projectGroup } from './project-group.styles'

import type { ProjectReviews } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function ProjectGroup({
	project,
	reviews,
}: ProjectReviews): ReactElement {
	return (
		<section {...stylex.props(projectGroup.group)}>
			<header {...stylex.props(projectGroup.head)}>
				<h2 {...stylex.props(projectGroup.name)}>
					<AppLink
						to={projectPath(project)}
						{...stylex.props(projectGroup.link)}
					>
						<ProjectName project={project} />
					</AppLink>
				</h2>
				<span {...stylex.props(caption.base)}>
					{reviews.length} open
				</span>
			</header>
			<ReviewList project={project} reviews={reviews} />
		</section>
	)
}
