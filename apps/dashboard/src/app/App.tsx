import { QueryClientProvider } from '@tanstack/react-query'

import { AuthenticatedApp } from './AuthenticatedApp'
import { queryClient } from './query-client'

import type { ReactElement } from 'react'

export function App(): ReactElement {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthenticatedApp />
		</QueryClientProvider>
	)
}
