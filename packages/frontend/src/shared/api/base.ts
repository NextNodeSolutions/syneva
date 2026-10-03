import { DESK_PAGE_PREFIX, deskApiBase } from '@syneva/contracts/routes'

// Where this page's desk API lives. The hub serves every desk page under /d/<id>/ and that
// desk's API under /api/desks/<id>, so the id is read once from the page's own URL and every
// route path (API_PATHS.*) is prefixed with the base. Resolved lazily and cached: the location
// never changes for the life of the tab, and reading it at import time would couple module
// evaluation order to the document.
let cachedBase = ''
let isResolved = false

export function deskIdFromLocation(pathname: string): string {
	if (!pathname.startsWith(DESK_PAGE_PREFIX)) return ''
	const [id = ''] = pathname.slice(DESK_PAGE_PREFIX.length).split('/')
	return /^[a-f0-9]+$/.test(id) ? id : ''
}

// The API base of the desk this tab shows ('' outside a desk page, so a route path stands on
// its own - the dashboard's hub routes are absolute already).
export function apiBase(): string {
	if (!isResolved) {
		const id = deskIdFromLocation(window.location.pathname)
		cachedBase = id ? deskApiBase(id) : ''
		isResolved = true
	}
	return cachedBase
}

// A desk route path (API_PATHS.*) as the URL this tab must fetch.
export function deskUrl(path: string): string {
	return `${apiBase()}${path}`
}
