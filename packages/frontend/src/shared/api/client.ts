import { deskUrl } from './base'

// The generic JSON transport: the only module that talks to fetch directly. HTTP paths
// are NOT spelled here - callers pass constants from @contracts/routes (see the per-entity
// API boundary modules), and every desk route is prefixed with this tab's desk API base
// (/api/desks/<id> - see base.ts). The payload is returned as `unknown`: every endpoint's
// wire shape is decoded onto a frontend-owned model at its entity API boundary (see
// decode.ts and the per-entity mappers), never asserted at the call site.

// A boundary error: the hub answered, but not with something the tab can use (non-OK
// status, or a body that fails the endpoint's decoder). Named so the UI can show a cause
// instead of failing silently.
export class ApiError extends Error {
	constructor(
		message: string,
		readonly endpoint: string,
		readonly status: number,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

export const api = async (
	path: string,
	opts: RequestInit = {},
): Promise<unknown> => {
	const response = await fetch(deskUrl(path), {
		headers: { 'content-type': 'application/json' },
		...opts,
	})
	if (!response.ok)
		throw new ApiError(
			`${response.status} ${response.statusText}`,
			path,
			response.status,
		)
	return response.json()
}

// Hub-level routes are absolute (they carry no desk); the dashboard fetches them through
// this variant so the desk prefix never applies.
export const hubApi = async (
	path: string,
	opts: RequestInit = {},
): Promise<unknown> => {
	const response = await fetch(path, {
		headers: { 'content-type': 'application/json' },
		...opts,
	})
	if (!response.ok)
		throw new ApiError(
			`${response.status} ${response.statusText}`,
			path,
			response.status,
		)
	return response.json()
}
