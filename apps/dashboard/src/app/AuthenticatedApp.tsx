import { LoginPage } from '@pages/login/ui/LoginPage'
import { readSession } from '@shared/auth/client'
import { StatusMessage } from '@shared/ui/StatusMessage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Shell } from '@widgets/shell/ui/Shell'

import { PageOutlet } from './PageOutlet'

import type { ReactElement } from 'react'

export function AuthenticatedApp(): ReactElement {
	const queryClient = useQueryClient()
	const session = useQuery({
		queryKey: ['session'],
		queryFn: readSession,
		retry: false,
	})
	if (session.isPending)
		return <StatusMessage title="Checking your session…" />
	if (session.error)
		return (
			<StatusMessage title="Could not load Syneva" tone="error">
				{session.error.message}
			</StatusMessage>
		)
	if (session.data)
		return (
			<Shell>
				<PageOutlet />
			</Shell>
		)
	return (
		<LoginPage
			onSignedIn={async () => {
				await queryClient.invalidateQueries()
			}}
		/>
	)
}
