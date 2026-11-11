import { isNotFound } from '@shared/api/api-request-error'
import { QueryClient } from '@tanstack/react-query'

const MAX_RETRIES = 2

// A missing project or pull request stays missing: retrying only delays the message.
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error) =>
				failureCount < MAX_RETRIES && !isNotFound(error),
		},
	},
})
