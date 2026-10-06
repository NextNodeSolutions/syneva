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

import type { IncomingMessage, ServerResponse } from 'node:http'

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
	// True when the request may proceed; false once the guard has answered it (401 for an API caller, the sign-in page for a browser navigation).
	allows(req: IncomingMessage, res: ServerResponse, url: URL): boolean
	handleLogin(
		req: IncomingMessage,
		res: ServerResponse,
		url: URL,
	): Promise<void>
	handleLogout(res: ServerResponse): void
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
	const holdsKey = (req: IncomingMessage): boolean =>
		matches(bearerOf(req), digests.bearer) ||
		matches(cookieOf(req), digests.cookie, true)
	return {
		keyRequired: true,
		allows: (req, res, url) => allowsOrAnswers(holdsKey, req, res, url),
		handleLogin: (req, res, url) =>
			signIn({ holdsKey, digests, isSecureCookie }, req, res, url),
		handleLogout(res): void {
			res.setHeader('set-cookie', cookieHeader('', 0, isSecureCookie))
			redirect(res, HUB_PATHS.login)
		},
	}
}

function openGuard(): AccessGuard {
	return {
		keyRequired: false,
		allows: () => true,
		async handleLogin(_req, res): Promise<void> {
			redirect(res, '/')
		},
		handleLogout(res): void {
			redirect(res, '/')
		},
	}
}

function allowsOrAnswers(
	holdsKey: (req: IncomingMessage) => boolean,
	req: IncomingMessage,
	res: ServerResponse,
	url: URL,
): boolean {
	if (holdsKey(req)) return true
	if (isBrowserNavigation(req, url)) {
		html(res, HTTP_UNAUTHORIZED, loginPage({ next: url.pathname }))
		return false
	}
	fail(res, {
		status: HTTP_UNAUTHORIZED,
		code: 'UNAUTHORIZED',
		error: 'This hub requires its access key.',
		fix: 'Send `Authorization: Bearer <key>` (the CLI reads SYNEVA_KEY), or sign in at /login in a browser.',
	})
	return false
}

type SignInDeps = {
	holdsKey: (req: IncomingMessage) => boolean
	digests: KeyDigests
	isSecureCookie: boolean
}

async function signIn(
	deps: SignInDeps,
	req: IncomingMessage,
	res: ServerResponse,
	url: URL,
): Promise<void> {
	const next = safeNext(url.searchParams.get('next'))
	if (req.method === 'GET' && !url.searchParams.has('key')) {
		if (deps.holdsKey(req)) return redirect(res, next)
		return html(res, HTTP_OK, loginPage({ next }))
	}
	const presented = await presentedLoginKey(req, url)
	if (!matches(presented, deps.digests.bearer)) {
		html(
			res,
			HTTP_UNAUTHORIZED,
			loginPage({ next, error: 'That key does not open this hub.' }),
		)
		return
	}
	res.setHeader(
		'set-cookie',
		cookieHeader(
			deps.digests.cookie,
			COOKIE_MAX_AGE_SECONDS,
			deps.isSecureCookie,
		),
	)
	redirect(res, next)
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

function bearerOf(req: IncomingMessage): string | undefined {
	const { authorization } = req.headers
	if (!authorization?.startsWith(BEARER_PREFIX)) return undefined
	return authorization.slice(BEARER_PREFIX.length).trim()
}

function cookieOf(req: IncomingMessage): string | undefined {
	const { cookie } = req.headers
	if (!cookie) return undefined
	for (const part of cookie.split(';')) {
		const [name, ...rest] = part.trim().split('=')
		if (name === COOKIE_NAME) return rest.join('=')
	}
	return undefined
}

// A browser landing on a page gets the sign-in form; API callers (fetch, the CLI) get a 401 they can act on.
function isBrowserNavigation(req: IncomingMessage, url: URL): boolean {
	if (req.method !== 'GET') return false
	const accept = req.headers.accept ?? ''
	return accept.includes('text/html') || url.pathname === '/'
}

async function presentedLoginKey(
	req: IncomingMessage,
	url: URL,
): Promise<string | undefined> {
	const fromQuery = url.searchParams.get('key')
	if (fromQuery) return fromQuery
	if (req.method !== 'POST') return undefined
	const body = await readBody(req)
	if ((req.headers['content-type'] ?? '').includes('application/json'))
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
