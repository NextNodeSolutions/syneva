export const PAGE_ROUTES = {
	dashboard: '/',
	project: '/projects/:owner/:repo',
	review: '/projects/:owner/:repo/reviews/:number',
} as const
