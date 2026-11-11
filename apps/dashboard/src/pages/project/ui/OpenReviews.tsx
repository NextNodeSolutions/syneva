import { useProjects } from '@entities/project/api/use-projects'
import { findProject } from '@entities/project/model/find-project'
import { ReviewList } from '@entities/review/ui/ReviewList'
import { QueryStatus } from '@shared/ui/QueryStatus'
import { StatusMessage } from '@shared/ui/StatusMessage'
import { fullName } from '@syneva/contracts/projects'

import type { ProjectRef } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function OpenReviews({
	project,
}: {
	project: ProjectRef
}): ReactElement {
	const projects = useProjects()
	if (!projects.isSuccess)
		return (
			<QueryStatus
				error={projects.error}
				pendingTitle="Loading the project…"
				errorTitle="The project did not load."
			/>
		)
	const entry = findProject(projects.data, project)
	if (entry)
		return <ReviewList project={entry.project} reviews={entry.reviews} />
	return (
		<StatusMessage
			title={`No project named ${fullName(project)}.`}
			tone="error"
		/>
	)
}
