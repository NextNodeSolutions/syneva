// The HTTP the fake bridge speaks: the statuses it answers with, a JSON body read under a cap,
// and a JSON answer in the hub's error shape.
export const HTTP_OK = 200
export const HTTP_SWITCHING = 101
export const HTTP_BAD_REQUEST = 400
export const HTTP_UNAUTHORIZED = 401
export const HTTP_FORBIDDEN = 403
export const HTTP_NOT_FOUND = 404
export const HTTP_TOO_LARGE = 413
export const HTTP_TOO_MANY = 429
export const HTTP_BAD_GATEWAY = 502
export const HTTP_UNAVAILABLE = 503
export const HTTP_GATEWAY_TIMEOUT = 504

export function sendJson(response, status, body) {
	const text = JSON.stringify(body)
	response.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'content-length': Buffer.byteLength(text),
	})
	response.end(text)
}

export function failJson(response, status, code, error = code) {
	sendJson(response, status, { error, code })
}

// The request's body as bytes, or null once it passed `cap` (the rest is drained, never kept).
export async function readBytes(request, cap) {
	const parts = []
	let size = 0
	for await (const part of request) {
		size += part.length
		if (size <= cap) parts.push(part)
	}
	if (size > cap) return null
	return Buffer.concat(parts)
}

export async function readJson(request, cap) {
	const bytes = await readBytes(request, cap)
	if (!bytes?.length) return {}
	try {
		return JSON.parse(bytes.toString('utf8'))
	} catch {
		return {}
	}
}

// The Bearer a request carries, or ''.
export function bearerOf(request) {
	const header = request.headers.authorization ?? ''
	return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
}
