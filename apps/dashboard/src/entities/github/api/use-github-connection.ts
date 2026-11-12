import { fetchJson } from '@shared/api/fetch-json'
import { API_ROUTES } from '@syneva/contracts/api'
import { githubConnectionSchema } from '@syneva/contracts/github'
import { useQuery } from '@tanstack/react-query'

import type { GithubConnection } from '@syneva/contracts/github'
import type { UseQueryResult } from '@tanstack/react-query'

export function useGithubConnection(): UseQueryResult<GithubConnection> {
	return useQuery({
		queryKey: ['github-connection'],
		queryFn: ({ signal }) =>
			fetchJson(
				API_ROUTES.githubConnection,
				githubConnectionSchema,
				signal,
			),
		retry: false,
	})
}
