import type { ApiError } from '@syneva/contracts/api'

const NO_STORE = { 'cache-control': 'no-store' }

const STATUS_BY_CODE: Readonly<Record<ApiError['code'], number>> = {
	not_found: 404,
	method_not_allowed: 405,
	unauthorized: 401,
	forbidden: 403,
	invalid_request: 400,
	github_reconnect: 409,
	github_unavailable: 502,
	github_rate_limited: 429,
	diff_unavailable: 422,
	review_changed: 409,
	internal_error: 500,
}

export function jsonResponse(body: unknown): Response {
	return Response.json(body, { headers: NO_STORE })
}

export function errorResponse(
	body: ApiError,
	headers: Readonly<Record<string, string>> = {},
): Response {
	return Response.json(body, {
		status: STATUS_BY_CODE[body.code],
		headers: { ...NO_STORE, ...headers },
	})
}
