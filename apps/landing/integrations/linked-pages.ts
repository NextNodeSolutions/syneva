import { OPEN_SOURCE, SECTIONS } from '../src/entities/site/model/site-map'

import type { AstroIntegration } from 'astro'

// The navigation promises a page for every link (menus, footer, breadcrumbs,
// pagers): fail the build instead of shipping an entry that 404s.
export function linkedPages(): AstroIntegration {
	return {
		name: 'syneva:linked-pages',
		hooks: {
			'astro:build:done': ({ pages }) => {
				const built = new Set(
					pages.map(({ pathname }) => `/${pathname}`),
				)
				const linked = SECTIONS.flatMap(section =>
					section.items.map(page => page.href).concat(section.href),
				).concat(OPEN_SOURCE.href)
				const missing = linked.filter(href => !built.has(href))
				if (missing.length > 0)
					throw new Error(
						`navigation links without a page: ${missing.join(', ')}`,
					)
			},
		},
	}
}
