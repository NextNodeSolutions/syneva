import { useGithubConnection } from '@entities/github/api/use-github-connection'
import { account } from '@shared/ui/account.styles'
import * as stylex from '@stylexjs/stylex'

import { GithubConnectionActions } from './GithubConnectionActions'
import { GithubSettings } from './GithubSettings'

import type { ReactElement } from 'react'

export function GithubConnectionSection(): ReactElement {
	const connection = useGithubConnection()
	return (
		<section
			{...stylex.props(account.section)}
			aria-labelledby="github-heading"
		>
			<h2 id="github-heading" {...stylex.props(account.heading)}>
				GitHub connection
			</h2>
			<p {...stylex.props(account.copy)}>
				Connect your GitHub account, then install Syneva on the
				repositories you choose. You can sign in with GitHub after
				connecting.
			</p>
			<GithubConnectionActions
				isLinked={connection.data?.isLinked ?? false}
				isRefreshing={connection.isFetching}
				onRefresh={() => {
					void connection.refetch()
				}}
			/>
			{connection.isPending && (
				<p role="status" {...stylex.props(account.copy)}>
					Loading GitHub access…
				</p>
			)}
			{connection.error && (
				<p role="alert" {...stylex.props(account.error)}>
					{connection.error.message}
				</p>
			)}
			{connection.data && <GithubSettings connection={connection.data} />}
		</section>
	)
}
