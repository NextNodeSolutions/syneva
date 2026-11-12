import { signOut } from '@shared/auth/client'
import { account } from '@shared/ui/account.styles'
import { ActionButton } from '@shared/ui/ActionButton'
import * as stylex from '@stylexjs/stylex'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ReactElement } from 'react'

export function AccountSection(): ReactElement {
	const queryClient = useQueryClient()
	const leave = useMutation({
		mutationFn: signOut,
		onSuccess: async () => {
			await queryClient.resetQueries()
		},
	})
	return (
		<section
			{...stylex.props(account.section)}
			aria-labelledby="account-heading"
		>
			<h2 id="account-heading" {...stylex.props(account.heading)}>
				Your account
			</h2>
			<div>
				<ActionButton
					tone="secondary"
					disabled={leave.isPending}
					onClick={() => {
						leave.mutate()
					}}
				>
					Sign out
				</ActionButton>
			</div>
			{leave.error && (
				<p role="alert" {...stylex.props(account.error)}>
					{leave.error.message}
				</p>
			)}
		</section>
	)
}
