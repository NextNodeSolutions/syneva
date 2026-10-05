import { deskUrl } from './base'

// The generic JSON transport: the only module that talks to fetch directly. HTTP paths
// are NOT spelled here - callers pass constants from @contracts/routes (see the per-entity
// API boundary modules), and every desk route is prefixed with this tab's desk API base
// (/api/desks/<id> - see base.ts). The payload is returned as `unknown`: every endpoint's
// wire shape is decoded onto a frontend-owned model at its entity API boundary (see
// decode.ts and the per-entity mappers), never asserted at the call site.

// A boundary error: the hub answered with a non-OK status. Named so the UI can show a cause
// instead of failing silently: the message is the hub's own sentence when it sent one, and
// `code` its stable name for the cause (INVALID_OPEN, UNAUTHORIZED...) for a caller to branch on.
export class ApiError extends Error {
	constructor(
		message: string,
		readonly endpoint: string,
		readonly status: number,
		readonly code: string | undefined,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

// The hub answers a refusal with { error, code, fix }: `error` is the sentence for a person,
// `code` the cause's name. `fix` is written for agents and never shown. A body that is not
// JSON (a proxy's error page) leaves the status line as the message.
async function refusalOf(
	response: Response,
): Promise<{ message: string; code: string | undefined }> {
	const body: unknown = await response.json().catch(() => null)
	return {
		message:
			stringField(body, 'error') ??
			`${response.status} ${response.statusText}`,
		code: stringField(body, 'code'),
	}
}

function stringField(body: unknown, key: string): string | undefined {
	if (typeof body !== 'object' || body === null) return undefined
	const field: unknown = Reflect.get(body, key)
	if (typeof field !== 'string') return undefined
	return field
}

// The one JSON request pipeline; `endpoint` is the caller-facing path ApiError reports,
// which can differ from the resolved request URL (desk routes are prefixed with the desk base).
const request = async (
	url: string,
	endpoint: string,
	opts: RequestInit,
): Promise<unknown> => {
	const response = await fetch(url, {
		headers: { 'content-type': 'application/json' },
		...opts,
	})
	if (!response.ok) {
		const refusal = await refusalOf(response)
		throw new ApiError(
			refusal.message,
			endpoint,
			response.status,
			refusal.code,
		)
	}
	return response.json()
}

export const api = async (
	path: string,
	opts: RequestInit = {},
): Promise<unknown> => request(deskUrl(path), path, opts)

// Hub-level routes are absolute (they carry no desk); the dashboard fetches them through
// this variant so the desk prefix never applies.
export const hubApi = async (
	path: string,
	opts: RequestInit = {},
): Promise<unknown> => request(path, path, opts)
