import { DocumentTitle } from '@shared/ui/DocumentTitle'
import { PageBody } from '@shared/ui/PageBody'
import { PageHead } from '@shared/ui/PageHead'

import { AccountSection } from './AccountSection'
import { GithubConnectionSection } from './GithubConnectionSection'

import type { ReactElement } from 'react'

export function SettingsPage(): ReactElement {
	return (
		<>
			<DocumentTitle title="Settings" />
			<PageHead
				title="Settings"
				lede="Connect GitHub and choose the projects you review in Syneva."
			/>
			<PageBody>
				<GithubConnectionSection />
				<AccountSection />
			</PageBody>
		</>
	)
}
