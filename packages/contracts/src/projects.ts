import * as z from 'zod/mini'

// GitHub's own charsets: a segment that passes can never escape its place in an API path.
const OWNER_PATTERN = /^[a-z\d][a-z\d-]{0,38}$/i
const REPO_PATTERN = /^(?!\.{1,2}$)[\w.-]{1,100}$/
const NUMBER_SEGMENT_PATTERN = /^[1-9]\d{0,8}$/

export const projectRefSchema = z.object({
	owner: z.string().check(z.regex(OWNER_PATTERN)),
	repo: z.string().check(z.regex(REPO_PATTERN)),
})
export type ProjectRef = z.infer<typeof projectRefSchema>

// GitHub's name for a repository, the one people read and type.
export function fullName({ owner, repo }: ProjectRef): string {
	return `${owner}/${repo}`
}

export const reviewRefSchema = z.extend(projectRefSchema, {
	number: z.pipe(
		z.string().check(z.regex(NUMBER_SEGMENT_PATTERN)),
		z.transform(Number),
	),
})
export type ReviewRef = z.infer<typeof reviewRefSchema>

const countSchema = z.int().check(z.nonnegative())

export const churnSchema = z.object({
	files: countSchema,
	additions: countSchema,
	deletions: countSchema,
})
export type Churn = z.infer<typeof churnSchema>

export const reviewSummarySchema = z.object({
	number: z.int().check(z.positive()),
	title: z.string(),
	author: z.string(),
	base: z.string(),
	head: z.string(),
	isDraft: z.boolean(),
	updatedAt: z.iso.datetime(),
	churn: churnSchema,
})
export type ReviewSummary = z.infer<typeof reviewSummarySchema>

export const projectReviewsSchema = z.object({
	project: projectRefSchema,
	reviews: z.array(reviewSummarySchema),
})
export type ProjectReviews = z.infer<typeof projectReviewsSchema>

export const projectListSchema = z.object({
	projects: z.array(projectReviewsSchema),
})
export type ProjectList = z.infer<typeof projectListSchema>

// `diff` is the pull request's unified patch, as `git diff base...head` prints it.
export const reviewCodeSchema = z.object({
	project: projectRefSchema,
	review: reviewSummarySchema,
	diff: z.string(),
	unavailableFiles: z.array(z.string()),
})
export type ReviewCode = z.infer<typeof reviewCodeSchema>
