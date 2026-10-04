import { defineMiddleware } from 'astro:middleware'

// Sections shared by the landing and the subpages restyle themselves by the
// kind of page they render in. The route decides it before any component
// renders: the landing and the 404 have their own sheets, every other route
// opens with a page hero.
const KIND_BY_ROUTE: Partial<Record<string, App.PageKind>> = {
	'/': 'home',
	'/404': 'lost',
}

export const onRequest = defineMiddleware(({ locals, routePattern }, next) => {
	locals.page = KIND_BY_ROUTE[routePattern] ?? 'sub'
	return next()
})
