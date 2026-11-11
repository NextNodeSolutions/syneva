import { ProjectName } from '@entities/project/ui/ProjectName'
import { DocumentTitle } from '@shared/ui/DocumentTitle'
import { PageBody } from '@shared/ui/PageBody'
import { PageHead } from '@shared/ui/PageHead'
import { fullName } from '@syneva/contracts/projects'

import { OpenReviews } from './OpenReviews'

import type { ProjectRef } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function ProjectPage({
	project,
}: {
	project: ProjectRef
}): ReactElement {
	return (
		<>
			<DocumentTitle title={fullName(project)} />
			<PageHead
				eyebrow="Project"
				title={<ProjectName project={project} />}
			/>
			<PageBody>
				<OpenReviews project={project} />
			</PageBody>
		</>
	)
}
