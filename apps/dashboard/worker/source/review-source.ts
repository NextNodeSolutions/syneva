import type {
	ProjectReviews,
	ReviewCode,
	ReviewRef,
} from '@syneva/contracts/projects'

export type ReviewSource = {
	listProjects: () => Promise<ProjectReviews[]>
	readReview: (ref: ReviewRef) => Promise<ReviewCode | null>
}
