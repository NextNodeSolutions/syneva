// Renders the public site. Every page is a module under pages/ exporting
// { route, title, description, body, styles?, scripts? }; the layout wraps it
// in the shared head, navigation and footer. Build-time only - this folder is
// never shipped (scripts/build-landing.mjs excludes it).
import { documentShell } from './layout.mjs'
import { OPEN_SOURCE, SECTIONS } from './nav.mjs'

const PAGE_FILES = [
	'home',
	'product',
	'review-desk',
	'walkthrough',
	'ask-your-agent',
	'plan-desk',
	'workflows',
	'working-tree',
	'staged-changes',
	'pull-requests',
	'single-file',
	'resources',
	'get-started',
	'connect-your-agent',
	'faq',
	'changelog',
	'open-source',
	'not-found',
]

export async function loadPages() {
	const pages = await Promise.all(
		PAGE_FILES.map(
			async name => (await import(`./pages/${name}.mjs`)).default,
		),
	)
	// The navigation promises a page for every link: fail the build instead of
	// shipping a menu entry that 404s.
	const routes = new Set(pages.map(page => page.route))
	const linked = [
		...SECTIONS.flatMap(section => [
			section.href,
			...section.items.map(item => item.href),
		]),
		OPEN_SOURCE.href,
	]
	const missing = linked.filter(href => !routes.has(href))
	if (missing.length)
		throw new Error(`navigation links without a page: ${missing.join(', ')}`)
	return pages
}

export function renderPage(page) {
	return documentShell({
		...page,
		styles: page.styles ?? ['pages.css'],
		body: page.body(),
	})
}

// Route -> output file: '/' -> index.html, '/a/b/' -> a/b/index.html, and the
// not-found page keeps the 404.html name static hosts look for.
export function outputFile(route) {
	if (route === '/404') return '404.html'
	return `${route.replace(/^\/+/, '')}index.html`
}
