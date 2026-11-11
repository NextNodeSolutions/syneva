import * as z from 'zod/mini'

export const API_ROUTES = {
	projects: '/api/projects',
	review: '/api/projects/:owner/:repo/reviews/:number',
} as const

export const apiErrorSchema = z.object({
	code: z.enum(['not_found', 'method_not_allowed']),
	error: z.string(),
})
export type ApiError = z.infer<typeof apiErrorSchema>
