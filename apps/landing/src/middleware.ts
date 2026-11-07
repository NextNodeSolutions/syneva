import { defineMiddleware } from 'astro:middleware'

import { HOME_HREF } from '@entities/site/model/site-map'

// The route decides the layout kind before any component renders: home and 404 own their sheets, every other route opens with a page hero.
const KIND_BY_ROUTE: Partial<Record<string, App.PageKind>> = {
	[HOME_HREF]: 'home',
	'/404': 'lost',
}

export const onRequest = defineMiddleware(({ locals, routePattern }, next) => {
	locals.page = KIND_BY_ROUTE[routePattern] ?? 'sub'
	return next()
})
