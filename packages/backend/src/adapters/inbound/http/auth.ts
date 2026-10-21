import crypto from 'node:crypto'

import { HUB_PATHS } from '@syneva/contracts/routes'

import {
	HTTP_OK,
	HTTP_UNAUTHORIZED,
	readBody,
	fail,
	html,
	redirect,
} from './http.js'
import { loginPage } from './pages.js'

// The value is a digest of the key, never the key.
const COOKIE_NAME = 'syneva_key'
const SECONDS_PER_DAY = 86_400
const COOKIE_DAYS = 365
const COOKIE_MAX_AGE_SECONDS = COOKIE_DAYS * SECONDS_PER_DAY
const BEARER_PREFIX = 'Bearer '

// With a key configured, every request must prove it: `Authorization: Bearer <key>` (CLI and pi listener) or the HttpOnly cookie a browser carries after signing in once at /login.
// Without a key (a loopback-only hub) the gate is open and the same-origin guard alone protects the hub.
export type AccessGuard = {
	readonly keyRequired: boolean
	// Null when the request may proceed; else the guard's answer (401 for an API caller, the sign-in page for a browser navigation).
	refusal(request: Request, url: URL): Response | null
	login(request: Request, url: URL): Promise<Response>
	logout(): Response
}

// Two secrets derived from the key: what a Bearer header must hash to, and what the signed-in cookie carries (a leaked cookie is not the key itself).
type KeyDigests = { bearer: string; cookie: string }

export function createAccessGuard(
	key: string | undefined,
	isSecureCookie: boolean,
): AccessGuard {
	if (!key) return openGuard()
	const digests: KeyDigests = {
		bearer: hashOf(key),
		cookie: hashOf(`cookie:${key}`),
	}
	const holdsKey = (request: Request): boolean =>
		matches(bearerOf(request), digests.bearer) ||
		matches(cookieOf(request), digests.cookie, true)
	return {
		keyRequired: true,
		refusal: (request, url) => refuseWithoutKey(holdsKey, request, url),
		login: (request, url) =>
			signIn({ holdsKey, digests, isSecureCookie }, request, url),
		logout: () =>
			redirect(HUB_PATHS.login, cookieHeader('', 0, isSecureCookie)),
	}
}

function openGuard(): AccessGuard {
	return {
		keyRequired: false,
		refusal: () => null,
		login: async () => redirect('/'),
		logout: () => redirect('/'),
	}
}

function refuseWithoutKey(
	holdsKey: (request: Request) => boolean,
	request: Request,
	url: URL,
): Response | null {
	if (holdsKey(request)) return null
	if (isBrowserNavigation(request, url))
		return html(HTTP_UNAUTHORIZED, loginPage({ next: url.pathname }))
	return fail({
		status: HTTP_UNAUTHORIZED,
		code: 'UNAUTHORIZED',
		error: 'This hub requires its access key.',
		fix: 'Send `Authorization: Bearer <key>` (the CLI reads SYNEVA_KEY), or sign in at /login in a browser.',
	})
}

type SignInDeps = {
	holdsKey: (request: Request) => boolean
	digests: KeyDigests
	isSecureCookie: boolean
}

async function signIn(
	deps: SignInDeps,
	request: Request,
	url: URL,
): Promise<Response> {
	const next = safeNext(url.searchParams.get('next'))
	if (request.method === 'GET' && !url.searchParams.has('key')) {
		if (deps.holdsKey(request)) return redirect(next)
		return html(HTTP_OK, loginPage({ next }))
	}
	const presented = await presentedLoginKey(request, url)
	if (!matches(presented, deps.digests.bearer))
		return html(
			HTTP_UNAUTHORIZED,
			loginPage({ next, error: 'That key does not open this hub.' }),
		)
	return redirect(
		next,
		cookieHeader(
			deps.digests.cookie,
			COOKIE_MAX_AGE_SECONDS,
			deps.isSecureCookie,
		),
	)
}

function hashOf(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex')
}

// Constant-time compare: hashing the candidate first makes both sides the same length, so timingSafeEqual never short-circuits on length.
function matches(
	candidate: string | undefined,
	digest: string,
	isAlreadyHashed = false,
): boolean {
	if (!candidate) return false
	const left = Buffer.from(isAlreadyHashed ? candidate : hashOf(candidate))
	const right = Buffer.from(digest)
	return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function bearerOf(request: Request): string | undefined {
	const authorization = request.headers.get('authorization')
	if (!authorization?.startsWith(BEARER_PREFIX)) return undefined
	return authorization.slice(BEARER_PREFIX.length).trim()
}

function cookieOf(request: Request): string | undefined {
	const cookie = request.headers.get('cookie')
	if (!cookie) return undefined
	for (const part of cookie.split(';')) {
		const [name, ...rest] = part.trim().split('=')
		if (name === COOKIE_NAME) return rest.join('=')
	}
	return undefined
}

// A browser landing on a page gets the sign-in form; API callers (fetch, the CLI) get a 401 they can act on.
function isBrowserNavigation(request: Request, url: URL): boolean {
	if (request.method !== 'GET') return false
	const accept = request.headers.get('accept') ?? ''
	return accept.includes('text/html') || url.pathname === '/'
}

async function presentedLoginKey(
	request: Request,
	url: URL,
): Promise<string | undefined> {
	const fromQuery = url.searchParams.get('key')
	if (fromQuery) return fromQuery
	if (request.method !== 'POST') return undefined
	const body = await readBody(request)
	if (
		(request.headers.get('content-type') ?? '').includes('application/json')
	)
		return keyFromJson(body)
	return new URLSearchParams(body).get('key') ?? undefined
}

function keyFromJson(body: string): string | undefined {
	let parsed: unknown
	try {
		parsed = JSON.parse(body)
	} catch {
		return undefined
	}
	if (typeof parsed !== 'object' || parsed === null || !('key' in parsed))
		return undefined
	if (typeof parsed.key !== 'string') return undefined
	return parsed.key
}

// Only a path on this hub may be the post-login destination: an absolute URL or a
// protocol-relative //host would be an open redirect, and a prefix test is not enough (a browser
// reads "/\evil.com" and "/<tab>/evil.com" as //evil.com), so the value resolves against a
// placeholder origin, survives only if it stays there, is rebuilt from its parsed path, and one
// resolving to "//..." is refused.
const NEXT_BASE = new URL('http://hub.invalid/')

function safeNext(next: string | null): string {
	if (!next?.startsWith('/')) return '/'
	const target = URL.canParse(next, NEXT_BASE)
		? new URL(next, NEXT_BASE)
		: null
	if (target?.origin !== NEXT_BASE.origin) return '/'
	if (target.pathname.startsWith('//')) return '/'
	return `${target.pathname}${target.search}${target.hash}`
}

function cookieHeader(
	token: string,
	maxAgeSeconds: number,
	isSecure: boolean,
): string {
	const attributes = [
		`${COOKIE_NAME}=${token}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${maxAgeSeconds}`,
	]
	if (isSecure) attributes.push('Secure')
	return attributes.join('; ')
}
