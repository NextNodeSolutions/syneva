import { DESK_PAGE_PREFIX, deskApiBase } from '@syneva/contracts/routes'

// Every desk lives under /d/<id>/ and its API under /api/desks/<id>: the id is read once from the
// page's own URL and every route path is prefixed with the base; resolved lazily because reading at
// import time would couple module evaluation order to the document.
let cachedBase = ''
let isResolved = false

export function deskIdFromLocation(pathname: string): string {
	if (!pathname.startsWith(DESK_PAGE_PREFIX)) return ''
	const [id = ''] = pathname.slice(DESK_PAGE_PREFIX.length).split('/')
	return /^[a-f0-9]+$/.test(id) ? id : ''
}

export function apiBase(): string {
	if (!isResolved) {
		const id = deskIdFromLocation(window.location.pathname)
		cachedBase = id ? deskApiBase(id) : ''
		isResolved = true
	}
	return cachedBase
}

export function deskUrl(path: string): string {
	return `${apiBase()}${path}`
}
