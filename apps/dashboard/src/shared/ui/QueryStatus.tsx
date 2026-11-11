import { StatusMessage } from './StatusMessage'

import type { ReactElement } from 'react'

type QueryStatusProps = {
	error: Error | null
	pendingTitle: string
	errorTitle: string
}

export function QueryStatus({
	error,
	pendingTitle,
	errorTitle,
}: QueryStatusProps): ReactElement {
	if (!error) return <StatusMessage title={pendingTitle} />
	return (
		<StatusMessage title={errorTitle} tone="error">
			{error.message}
		</StatusMessage>
	)
}
