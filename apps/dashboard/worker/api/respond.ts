import type { ApiError } from '@syneva/contracts/api'

const NO_STORE = { 'cache-control': 'no-store' }

const STATUS_BY_CODE: Readonly<Record<ApiError['code'], number>> = {
	not_found: 404,
	method_not_allowed: 405,
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
