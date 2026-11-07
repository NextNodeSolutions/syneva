import { fetchJson } from '@shared/api/fetch-json'
import { API_ROUTES } from '@syneva/contracts/api'
import { fillPath } from '@syneva/contracts/paths'
import { reviewCodeSchema } from '@syneva/contracts/projects'
import { useQuery } from '@tanstack/react-query'

import type { ReviewCode, ReviewRef } from '@syneva/contracts/projects'
import type { UseQueryResult } from '@tanstack/react-query'

export function useReview(ref: ReviewRef): UseQueryResult<ReviewCode> {
	return useQuery({
		queryKey: ['review', ref.owner, ref.repo, ref.number],
		queryFn: ({ signal }) =>
			fetchJson(
				fillPath(API_ROUTES.review, ref),
				reviewCodeSchema,
				signal,
			),
	})
}
