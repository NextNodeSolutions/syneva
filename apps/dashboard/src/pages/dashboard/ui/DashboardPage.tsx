import { DocumentTitle } from '@shared/ui/DocumentTitle'
import { PageBody } from '@shared/ui/PageBody'
import { PageHead } from '@shared/ui/PageHead'

import { ProjectGroups } from './ProjectGroups'

import type { ReactElement } from 'react'

export function DashboardPage(): ReactElement {
	return (
		<>
			<DocumentTitle title="Dashboard" />
			<PageHead
				eyebrow="Dashboard"
				title="Open pull requests"
				lede="Every open pull request, grouped by project, the latest change first."
			/>
			<PageBody>
				<ProjectGroups />
			</PageBody>
		</>
	)
}
