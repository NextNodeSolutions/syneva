import { account } from '@shared/ui/account.styles'
import * as stylex from '@stylexjs/stylex'
import { press } from '@syneva/design-system/press.styles'

import { GithubInstallations } from './GithubInstallations'
import { RepositorySelection } from './RepositorySelection'

import type { GithubConnection } from '@syneva/contracts/github'
import type { ReactElement } from 'react'

export function GithubSettings({
	connection,
}: {
	connection: GithubConnection
}): ReactElement | null {
	if (!connection.isLinked) return null
	return (
		<>
			<div {...stylex.props(account.row)}>
				<a
					href={connection.installUrl}
					target="_blank"
					rel="noreferrer"
					{...stylex.props(
						press.control,
						account.button,
						account.secondary,
					)}
				>
					Choose repositories on GitHub
				</a>
			</div>
			<p {...stylex.props(account.copy)}>
				Syneva can read code, publish pull request reviews, and run
				GitHub Actions on repositories you grant. This release only
				reads pull requests. After changing access on GitHub, select
				Refresh access.
			</p>
			<GithubInstallations installations={connection.installations} />
			{connection.repositories.length > 0 ? (
				<RepositorySelection
					key={connection.repositories
						.map(
							repository =>
								`${repository.id}:${repository.isEnabled}`,
						)
						.join(',')}
					repositories={connection.repositories}
				/>
			) : (
				<p {...stylex.props(account.copy)}>
					No repositories are available yet. Install Syneva on your
					personal account or organization, then refresh access. An
					organization owner may need to approve installation.
				</p>
			)}
		</>
	)
}
