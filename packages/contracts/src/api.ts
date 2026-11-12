import * as z from 'zod/mini'

export const AUTH_PATH = '/api/auth'

export const API_ROUTES = {
	githubConnection: '/api/github/connection',
	githubProjects: '/api/github/projects',
	projects: '/api/projects',
	review: '/api/projects/:owner/:repo/reviews/:number',
} as const

export const apiErrorSchema = z.object({
	code: z.enum([
		'not_found',
		'method_not_allowed',
		'unauthorized',
		'forbidden',
		'invalid_request',
		'github_reconnect',
		'github_unavailable',
		'github_rate_limited',
		'diff_unavailable',
		'review_changed',
		'internal_error',
	]),
	error: z.string(),
})
export type ApiError = z.infer<typeof apiErrorSchema>
