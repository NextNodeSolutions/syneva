import { account } from '@shared/ui/account.styles'
import { ActionButton } from '@shared/ui/ActionButton'
import * as stylex from '@stylexjs/stylex'

import { useRepositorySelection } from '../model/use-repository-selection'

import { RepositoryChoices } from './RepositoryChoices'

import type { GithubRepository } from '@syneva/contracts/github'
import type { ReactElement } from 'react'

export function RepositorySelection({
	repositories,
}: {
	repositories: readonly GithubRepository[]
}): ReactElement {
	const { selected, toggle, save } = useRepositorySelection(repositories)
	return (
		<form
			onSubmit={event => {
				event.preventDefault()
				save.mutate()
			}}
			{...stylex.props(account.form)}
		>
			<h3 {...stylex.props(account.heading)}>Projects in Syneva</h3>
			<p {...stylex.props(account.copy)}>
				Choose which available repositories appear in your dashboard.
			</p>
			<RepositoryChoices
				repositories={repositories}
				selected={selected}
				toggle={toggle}
				isPending={save.isPending}
			/>
			<div>
				<ActionButton type="submit" disabled={save.isPending}>
					{save.isPending ? 'Saving…' : 'Save projects'}
				</ActionButton>
			</div>
			{save.error && (
				<p role="alert" {...stylex.props(account.error)}>
					{save.error.message}
				</p>
			)}
			{save.isSuccess && (
				<p role="status" {...stylex.props(account.success)}>
					Projects saved. Your dashboard is up to date.
				</p>
			)}
		</form>
	)
}
