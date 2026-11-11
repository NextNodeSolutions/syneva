import { Temporal } from '@js-temporal/polyfill'

import { countChurn } from './count-churn'
import { MOCK_PROJECTS } from './mock-projects'

import type {
	ProjectReviews,
	ReviewCode,
	ReviewRef,
	ReviewSummary,
} from '@syneva/contracts/projects'
import type { ReviewSource } from '../review-source'
import type { MockProject, MockReview } from './mock-projects'

export function createMockSource(): ReviewSource {
	const now = Temporal.Now.instant()
	return {
		listProjects: () =>
			Promise.resolve(
				MOCK_PROJECTS.map(entry => toProjectReviews(entry, now)),
			),
		readReview: ref => Promise.resolve(findReview(ref, now)),
	}
}

function toProjectReviews(
	{ project, reviews }: MockProject,
	now: Temporal.Instant,
): ProjectReviews {
	return { project, reviews: reviews.map(review => toSummary(review, now)) }
}

function toSummary(
	{ minutesAgo, diff, ...review }: MockReview,
	now: Temporal.Instant,
): ReviewSummary {
	return {
		...review,
		updatedAt: now.subtract({ minutes: minutesAgo }).toString(),
		churn: countChurn(diff),
	}
}

function findReview(ref: ReviewRef, now: Temporal.Instant): ReviewCode | null {
	const entry = MOCK_PROJECTS.find(
		({ project }) =>
			project.owner === ref.owner && project.repo === ref.repo,
	)
	const review = entry?.reviews.find(({ number }) => number === ref.number)
	if (!entry || !review) return null
	return {
		project: entry.project,
		review: toSummary(review, now),
		diff: review.diff,
	}
}
