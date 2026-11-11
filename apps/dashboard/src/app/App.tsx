import { QueryClientProvider } from '@tanstack/react-query'
import { Shell } from '@widgets/shell/ui/Shell'

import { PageOutlet } from './PageOutlet'
import { queryClient } from './query-client'

import type { ReactElement } from 'react'

export function App(): ReactElement {
	return (
		<QueryClientProvider client={queryClient}>
			<Shell>
				<PageOutlet />
			</Shell>
		</QueryClientProvider>
	)
}
