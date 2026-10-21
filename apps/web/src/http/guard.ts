// The same-origin rule of the local hub (core's binding.ts), on the web: a request a session
// cookie authenticates must be addressed to the web's own authority (SITE_URL's), and a mutation
// or a WebSocket upgrade, which a cross-site page can trigger with the cookie attached, must come
// from that origin or carry no Origin at all (a CLI, curl). Null when the request may proceed.
import { fail } from './answer.js'
import { HTTP_FORBIDDEN } from './status.js'

import type { Call } from './call.js'

const MUTATING_METHODS: ReadonlySet<string> = new Set([
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
])

export function sameOriginRefusal({
	request,
	url,
	env,
}: Call): Response | null {
	const authority = new URL(env.SITE_URL).host
	if (url.host !== authority)
		return fail({
			status: HTTP_FORBIDDEN,
			code: 'FORBIDDEN_HOST',
			error: `Host "${url.host}" is not this web.`,
			fix: `Reach the web at ${env.SITE_URL}.`,
		})
	if (!MUTATING_METHODS.has(request.method) && !isUpgrade(request))
		return null
	const origin = request.headers.get('origin')
	if (!origin || isOriginOf(origin, authority)) return null
	return fail({
		status: HTTP_FORBIDDEN,
		code: 'FORBIDDEN_ORIGIN',
		error: `Cross-site request from origin "${origin}" is not allowed.`,
		fix: 'The web only accepts same-origin requests.',
	})
}

export function isUpgrade(request: Request): boolean {
	return request.headers.get('upgrade')?.toLowerCase() === 'websocket'
}

// Behind a proxy that terminates TLS, the same authority may be spelled with either scheme.
function isOriginOf(origin: string, authority: string): boolean {
	return origin === `http://${authority}` || origin === `https://${authority}`
}
