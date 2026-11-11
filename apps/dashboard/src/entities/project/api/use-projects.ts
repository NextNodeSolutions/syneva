import { fetchJson } from '@shared/api/fetch-json'
import { API_ROUTES } from '@syneva/contracts/api'
import { projectListSchema } from '@syneva/contracts/projects'
import { useQuery } from '@tanstack/react-query'

import type { ProjectList } from '@syneva/contracts/projects'
import type { UseQueryResult } from '@tanstack/react-query'

export function useProjects(): UseQueryResult<ProjectList> {
	return useQuery({
		queryKey: ['projects'],
		queryFn: ({ signal }) =>
			fetchJson(API_ROUTES.projects, projectListSchema, signal),
	})
}
