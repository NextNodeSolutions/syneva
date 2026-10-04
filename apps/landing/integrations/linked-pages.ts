import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
	HOME_HREF,
	PAGES,
	SECTIONS,
	SITE_URL,
} from '../src/entities/site/model/site-map'

import type { AstroIntegration } from 'astro'

type Link = { path: string; route: string }

// An href or src attribute, the only places the built pages reference a URL.
const REFERENCE = /\s(?:href|src)="([^"]*)"/g
const SITE_ORIGIN = new URL(SITE_URL).origin

const htmlFiles = (root: string): string[] =>
	readdirSync(root, { recursive: true, encoding: 'utf8' }).filter(file =>
		file.endsWith('.html'),
	)

// The address a built file answers: dist/product/index.html is /product/.
const routeOf = (file: string): string =>
	`/${file.split(sep).join('/')}`.replace(/index\.html$/, '')

// A reference on the site itself, as a decoded path; links elsewhere and
// in-page fragments resolve to another origin or to the page's own path.
function internalPath(reference: string, route: string): string | undefined {
	const url = new URL(reference, `${SITE_URL}${route}`)
	if (url.origin !== SITE_ORIGIN) return undefined
	return decodeURI(url.pathname)
}

function linksOf(root: string, file: string): Link[] {
	const route = routeOf(file)
	const html = readFileSync(join(root, file), 'utf8')
	return [...html.matchAll(REFERENCE)].flatMap(([, reference = '']) => {
		const path = internalPath(reference, route)
		return path ? [{ path, route }] : []
	})
}

// A directory address serves its index.html; any other path is a file the
// build wrote, from a page or from public/.
const resolves = (root: string, path: string): boolean =>
	existsSync(join(root, path.endsWith('/') ? `${path}index.html` : path))

const siteMapLinks = (): Link[] =>
	[
		HOME_HREF,
		...SECTIONS.map(section => section.href),
		...Object.values(PAGES).map(page => page.href),
	].map(path => ({ path, route: 'the site map' }))

// Every internal reference must reach a file the build wrote: a page or a
// public asset. The site map's entries count too, linked or not. A
// hardcoded href, a link inside copy or a moved asset fails the build
// instead of shipping a dead link.
export function linkedPages(): AstroIntegration {
	return {
		name: 'syneva:linked-pages',
		hooks: {
			'astro:build:done': ({ dir, logger }) => {
				const root = fileURLToPath(dir)
				const links = htmlFiles(root)
					.flatMap(file => linksOf(root, file))
					.concat(siteMapLinks())
				const dead = links.filter(({ path }) => !resolves(root, path))
				if (dead.length > 0)
					throw new Error(
						`dead internal links:\n${dead.map(({ path, route }) => `  ${path} (on ${route})`).join('\n')}`,
					)
				logger.info(`${links.length} internal links resolve`)
			},
		},
	}
}
