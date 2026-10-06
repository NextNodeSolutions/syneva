import { DOCS } from './failure.js'

import type { IncomingMessage, ServerResponse } from 'node:http'
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
export const HTTP_CONFLICT = 409
export const HTTP_UNPROCESSABLE = 422
export const HTTP_INTERNAL = 500

// 50 MB: pre-0.6.2 tabs POST the whole multi-MB ReviewState on /send and a big PR desk crosses 5 MB - the old cap made Send fail on exactly the largest reviews (the body threw before any result existed: no artifact, no event).
// Loopback-only or key-guarded, so a generous cap is safe.
const MAX_BODY_BYTES = 50_000_000

export async function readBody(req: IncomingMessage): Promise<string> {
	const chunks: Buffer[] = []
	let size = 0
	for await (const chunk of req) {
		const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
		size += buf.length
		if (size > MAX_BODY_BYTES)
			throw new BodyDecodeError('Request body too large')
		chunks.push(buf)
	}
	return Buffer.concat(chunks).toString('utf8')
}

// Transport-owned by design - the router answers it with a 4xx (the caller's bug) instead of the INTERNAL 500 fallback, so a bad request can never be misread as a desk failure.
export class BodyDecodeError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options)
		this.name = 'BodyDecodeError'
	}
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
	const raw = await readBody(req)
	try {
		return JSON.parse(raw)
	} catch (cause) {
		throw new BodyDecodeError('Request body is not valid JSON', { cause })
	}
}

export function json(res: ServerResponse, status: number, body: unknown): void {
	jsonBody(res, status, JSON.stringify(body))
}

// /state hands back the serialized string its cache holds instead of stringifying the (possibly multi-MB) browser projection a second time.
export function jsonBody(
	res: ServerResponse,
	status: number,
	serialized: string,
): void {
	res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
	res.end(serialized)
}

export function html(res: ServerResponse, status: number, body: string): void {
	res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' })
	res.end(body)
}

export function redirect(res: ServerResponse, location: string): void {
	res.writeHead(HTTP_SEE_OTHER, { location })
	res.end()
}

export function fail(res: ServerResponse, failure: ApiFailure): void {
	json(res, failure.status, {
		error: failure.error,
		code: failure.code,
		fix: failure.fix,
		docs: DOCS,
	})
}
