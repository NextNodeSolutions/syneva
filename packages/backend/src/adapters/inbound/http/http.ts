import { errorMessage } from '../../../application/errors.js'

import { DOCS } from './failure.js'

import type { ApiFailure } from './failure.js'

// Named so every route spells the same code the same way - the response codes are part of the agent contract (`syneva spec`), not decoration.
export const HTTP_OK = 200
export const HTTP_NO_CONTENT = 204
export const HTTP_MOVED_PERMANENTLY = 301
export const HTTP_SEE_OTHER = 303
export const HTTP_NOT_MODIFIED = 304
export const HTTP_BAD_REQUEST = 400
export const HTTP_UNAUTHORIZED = 401
export const HTTP_FORBIDDEN = 403
export const HTTP_NOT_FOUND = 404
export const HTTP_METHOD_NOT_ALLOWED = 405
export const HTTP_CONFLICT = 409
export const HTTP_UNPROCESSABLE = 422
export const HTTP_INTERNAL = 500

// 50 MB: pre-0.6.2 tabs POST the whole multi-MB ReviewState on /send and a big PR desk crosses 5 MB - the old cap made Send fail on exactly the largest reviews (the body threw before any result existed: no artifact, no event).
// Loopback-only or key-guarded, so a generous cap is safe.
const MAX_BODY_BYTES = 50_000_000

const JSON_TYPE = 'application/json; charset=utf-8'
const HTML_TYPE = 'text/html; charset=utf-8'

// Read as it arrives and refused past the cap: request.text() would take any size.
export async function readBody(request: Request): Promise<string> {
	if (!request.body) return ''
	const decoder = new TextDecoder()
	let text = ''
	let size = 0
	for await (const chunk of request.body) {
		size += chunk.byteLength
		if (size > MAX_BODY_BYTES)
			throw new BodyDecodeError('Request body too large')
		text += decoder.decode(chunk, { stream: true })
	}
	return text + decoder.decode()
}

// Transport-owned by design - the router answers it with a 4xx (the caller's bug) instead of the INTERNAL 500 fallback, so a bad request can never be misread as a desk failure.
export class BodyDecodeError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options)
		this.name = 'BodyDecodeError'
	}
}

export async function readJsonBody(request: Request): Promise<unknown> {
	const raw = await readBody(request)
	try {
		return JSON.parse(raw)
	} catch (cause) {
		throw new BodyDecodeError('Request body is not valid JSON', { cause })
	}
}

export function json(status: number, body: unknown): Response {
	return jsonBody(status, JSON.stringify(body))
}

// /state hands back the serialized string its cache holds instead of stringifying the (possibly multi-MB) browser projection a second time.
export function jsonBody(status: number, serialized: string): Response {
	return new Response(serialized, {
		status,
		headers: { 'content-type': JSON_TYPE },
	})
}

export function html(status: number, body: string): Response {
	return new Response(body, {
		status,
		headers: { 'content-type': HTML_TYPE },
	})
}

// A response with no body: a 204, a 304, a bare 404, a redirect's own status.
export function bodiless(
	status: number,
	headers: Record<string, string> = {},
): Response {
	return new Response(null, { status, headers })
}

export function redirect(location: string, setCookie?: string): Response {
	const headers: Record<string, string> = { location }
	if (setCookie) headers['set-cookie'] = setCookie
	return bodiless(HTTP_SEE_OTHER, headers)
}

export function fail(failure: ApiFailure): Response {
	return json(failure.status, {
		error: failure.error,
		code: failure.code,
		fix: failure.fix,
		docs: DOCS,
	})
}

// The one place an unexpected throw becomes a response: a BodyDecodeError is the caller's bug (malformed/oversized body) and answers 400; anything else is an INTERNAL 500.
export function failureOf(error: unknown): Response {
	if (error instanceof BodyDecodeError)
		return fail({
			status: HTTP_BAD_REQUEST,
			code: 'INVALID_JSON',
			error: errorMessage(error),
			fix: `Send a JSON body of the documented shape. See ${DOCS} for the routes.`,
		})
	return fail({
		status: HTTP_INTERNAL,
		code: 'INTERNAL',
		error: errorMessage(error),
		fix: 'Unexpected server error; retry once, then reload the desk.',
	})
}
