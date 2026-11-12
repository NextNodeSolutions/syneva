import { linkGithub } from '@shared/auth/client'
import { account } from '@shared/ui/account.styles'
import { ActionButton } from '@shared/ui/ActionButton'
import * as stylex from '@stylexjs/stylex'
import { useMutation } from '@tanstack/react-query'

import type { ReactElement } from 'react'

type GithubConnectionActionsProps = {
	isLinked: boolean
	isRefreshing: boolean
	onRefresh: () => void
}

export function GithubConnectionActions({
	isLinked,
	isRefreshing,
	onRefresh,
}: GithubConnectionActionsProps): ReactElement {
	const link = useMutation({ mutationFn: linkGithub })
	const callbackFailure = new URLSearchParams(window.location.search).has(
		'error',
	)
		? 'GitHub could not be connected. Retry the connection.'
		: ''
	const failure = link.error?.message ?? callbackFailure
	return (
		<>
			<div {...stylex.props(account.row)}>
				<ActionButton
					disabled={link.isPending}
					onClick={() => {
						link.mutate()
					}}
				>
					{isLinked ? 'Reconnect GitHub' : 'Connect GitHub'}
				</ActionButton>
				<ActionButton
					tone="secondary"
					disabled={isRefreshing}
					onClick={onRefresh}
				>
					Refresh access
				</ActionButton>
			</div>
			{failure && (
				<p role="alert" {...stylex.props(account.error)}>
					{failure}
				</p>
			)}
		</>
	)
}
