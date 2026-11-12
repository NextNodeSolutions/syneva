export const PAGE_ROUTES = {
	dashboard: '/',
	settings: '/settings',
	project: '/projects/:owner/:repo',
	review: '/projects/:owner/:repo/reviews/:number',
} as const
