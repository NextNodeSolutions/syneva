import { account } from '@shared/ui/account.styles'
import * as stylex from '@stylexjs/stylex'
import { fullName } from '@syneva/contracts/projects'

import type { GithubRepository } from '@syneva/contracts/github'
import type { ReactElement } from 'react'

type RepositoryChoicesProps = {
	repositories: readonly GithubRepository[]
	selected: ReadonlySet<number>
	toggle: (id: number) => void
	isPending: boolean
}

export function RepositoryChoices({
	repositories,
	selected,
	toggle,
	isPending,
}: RepositoryChoicesProps): ReactElement {
	return (
		<ul {...stylex.props(account.list)}>
			{repositories.map(repository => (
				<li key={repository.id}>
					<label {...stylex.props(account.repository)}>
						<input
							type="checkbox"
							checked={selected.has(repository.id)}
							disabled={isPending}
							onChange={() => {
								toggle(repository.id)
							}}
							{...stylex.props(account.checkbox)}
						/>
						<span>{fullName(repository)}</span>
						<span {...stylex.props(account.badge)}>
							{repository.isPrivate ? 'Private' : 'Public'}
						</span>
					</label>
				</li>
			))}
		</ul>
	)
}
