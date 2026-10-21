// How the Worker answers: JSON, the error shape every refusal uses (`{ error, code }`, plus what
// to do next when there is something to say, as core's http.ts), its pages, its redirects.
import {
	HTTP_FOUND,
	HTTP_INTERNAL,
	HTTP_SEE_OTHER,
	HTTP_UNAUTHORIZED,
} from './status.js'

export type Failure = {
	status: number
	code: string
	error: string
	fix?: string | undefined
}

const JSON_TYPE = 'application/json; charset=utf-8'
const HTML_TYPE = 'text/html; charset=utf-8'
// Nothing the Worker answers is cached by a browser or a proxy: identity, settings, pages that
// read a session.
const NO_STORE = 'no-store'

export function json(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': JSON_TYPE, 'cache-control': NO_STORE },
	})
}

export function fail(failure: Failure): Response {
	const { status, code, error, fix } = failure
	return json(status, fix ? { error, code, fix } : { error, code })
}

export function html(status: number, body: string): Response {
	return new Response(body, {
		status,
		headers: { 'content-type': HTML_TYPE, 'cache-control': NO_STORE },
	})
}

// A form's answer (303, the browser follows with a GET), with the cookie it sets if any.
export function seeOther(location: string, setCookie?: string): Response {
	const headers = new Headers({ location, 'cache-control': NO_STORE })
	if (setCookie) headers.set('set-cookie', setCookie)
	return new Response(null, { status: HTTP_SEE_OTHER, headers })
}

// A page that needs a session sends a signed-out browser to the sign-in page, back here after.
export function toSignIn(next: string): Response {
	const location =
		next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`
	return new Response(null, {
		status: HTTP_FOUND,
		headers: { location, 'cache-control': NO_STORE },
	})
}

export const SIGNED_OUT: Failure = {
	status: HTTP_UNAUTHORIZED,
	code: 'UNAUTHORIZED',
	error: 'Not signed in.',
	fix: 'Sign in at /login.',
}

export const INTERNAL: Failure = {
	status: HTTP_INTERNAL,
	code: 'INTERNAL',
	error: 'The web failed to answer this request.',
	fix: 'Retry once; if it fails again, the service is having trouble.',
}
