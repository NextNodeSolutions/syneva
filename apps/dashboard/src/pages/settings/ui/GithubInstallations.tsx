import { account } from '@shared/ui/account.styles'
import * as stylex from '@stylexjs/stylex'

import type { GithubConnection } from '@syneva/contracts/github'
import type { ReactElement } from 'react'

export function GithubInstallations({
	installations,
}: Pick<GithubConnection, 'installations'>): ReactElement {
	return (
		<>
			{installations.map(installation => (
				<p key={installation.id} {...stylex.props(account.copy)}>
					<a
						href={installation.configurationUrl}
						target="_blank"
						rel="noreferrer"
						{...stylex.props(account.link)}
					>
						Manage {installation.account} installation
					</a>
					{!installation.hasRequiredPermissions &&
						' · Update permissions on GitHub to allow code reading, PR reviews, and Actions.'}
				</p>
			))}
		</>
	)
}
