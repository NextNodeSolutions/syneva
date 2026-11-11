import { Temporal } from '@js-temporal/polyfill'

import type {
	ProjectList,
	ProjectReviews,
	ReviewSummary,
} from '@syneva/contracts/projects'
import type { ReviewSource } from '../source/review-source'

export async function listProjects(source: ReviewSource): Promise<ProjectList> {
	const projects = await source.listProjects()
	return {
		projects: projects
			.map(({ project, reviews }) => ({
				project,
				reviews: reviews.toSorted(byLatestUpdate),
			}))
			.toSorted(byLatestReview),
	}
}

function byLatestUpdate(left: ReviewSummary, right: ReviewSummary): number {
	return Temporal.Instant.compare(right.updatedAt, left.updatedAt)
}

function byLatestReview(left: ProjectReviews, right: ProjectReviews): number {
	const [leftLatest] = left.reviews
	const [rightLatest] = right.reviews
	if (!leftLatest) return rightLatest ? 1 : 0
	if (!rightLatest) return -1
	return byLatestUpdate(leftLatest, rightLatest)
}
