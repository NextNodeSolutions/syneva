import { HTTP_FORBIDDEN, fail } from './http.js'

import type { IncomingMessage, ServerResponse } from 'node:http'

// Wrap a bare IPv6 literal in brackets for use as a URL/authority host; leave names and IPv4
// (and already-bracketed literals) untouched. An IPv6 address is the only host that needs it.
function urlHost(host: string): string {
	return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
}

// The loopback authorities the hub has always trusted. A non-loopback bind EXTENDS this set (never
// replaces it) so the same-machine agent CLI, which talks to 127.0.0.1 regardless of bind address,
// keeps working.
const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '[::1]'] as const
// Host strings that mean "this machine's loopback" (no widening) and "every interface" (a wildcard
// bind has no single address to advertise, so loopback still reaches it).
const LOOPBACK_BINDS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])
const WILDCARD_BINDS = new Set(['0.0.0.0', '::', '[::]'])
// An allowed-hosts entry that names its own port ("review.example.com:8443", "[::1]:4747") is a
// complete authority: trusted as spelled, never re-suffixed with the bound port.
const AUTHORITY_WITH_PORT = /^(\[[^\]]+\]|[^:]+):\d+$/
// HTTP methods that change state and so must also pass the Origin check (a cross-site page can
// trigger them with a form or fetch; a GET only reads).
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export type Binding = {
	// The URL host a browser (possibly on another device) uses - printed and opened.
	browserHost: string
	// The URL host the same-machine agent CLI reaches the hub at, recorded in the hub lock.
	lockHost: string
	// The host names whose `name:port` authority the origin guard accepts (the bound port is
	// appended at request time, once it is known).
	allowedHosts: string[]
	// Complete authorities trusted as spelled: the public URL's host behind a reverse proxy, and
	// allowed-hosts entries that carry their own port.
	extraAuthorities: string[]
}

export function isLoopbackHost(host: string): boolean {
	return LOOPBACK_BINDS.has(host)
}

// Derive the browser URL host, the lock URL host, and the origin-guard authorities from the bind
// address. Pure (hostname + env injected) so it's unit-testable without binding exotic addresses.
// The default (loopback) path adds NOTHING to the loopback authority set and keeps both URLs on
// 127.0.0.1. A wildcard bind (0.0.0.0/::) advertises the machine's hostname to the browser but
// keeps the lock on loopback (still reachable). A specific non-loopback bind can't be reached over
// loopback, so both URLs use that exact address. os.hostname(), SYNEVA_ALLOWED_HOSTS (a MagicDNS
// FQDN differs from the short hostname) and the public URL's host widen the guard.
export function resolveBinding(
	host: string,
	hostname: string,
	allowedHostsEnv: string[],
	publicHost?: string,
): Binding {
	const extraAuthorities = [
		...(publicHost ? [publicHost] : []),
		...allowedHostsEnv.filter(entry => AUTHORITY_WITH_PORT.test(entry)),
	]
	const bareHosts = allowedHostsEnv.filter(
		entry => !AUTHORITY_WITH_PORT.test(entry),
	)
	if (LOOPBACK_BINDS.has(host))
		return {
			browserHost: '127.0.0.1',
			lockHost: '127.0.0.1',
			allowedHosts: [...LOOPBACK_HOSTS, ...bareHosts],
			extraAuthorities,
		}
	const wildcard = WILDCARD_BINDS.has(host)
	const extra = [
		hostname,
		...(wildcard ? [] : [urlHost(host)]),
		...bareHosts,
	].filter(Boolean)
	return {
		browserHost: wildcard ? hostname : urlHost(host),
		lockHost: wildcard ? '127.0.0.1' : urlHost(host),
		allowedHosts: [...LOOPBACK_HOSTS, ...extra],
		extraAuthorities,
	}
}

// Every `host[:port]` authority a request may name in Host / Origin: the bound names on the bound
// port, plus the complete authorities configured as such.
export function authoritiesFor(binding: Binding, port: number): string[] {
	return [
		...binding.allowedHosts.map(host => `${host}:${port}`),
		...binding.extraAuthorities,
	]
}

// Lock the hub to its own trusted origins. The hub binds a FIXED port, so the origin is guessable -
// without this, any page the reviewer has open in the same browser could POST to the state-changing
// routes (CSRF: /reset wipes a review, /shutdown closes a desk) or read a diff off-machine. The Host
// check defeats DNS-rebinding - a rebinding attack arrives with the attacker's hostname in Host - so
// only the hub's own authorities pass. The Origin check blocks cross-site mutations; header-less
// callers (curl and the `syneva await`/`comment`/`reload`/`status` CLI, which send no Origin) stay
// allowed. Returns false once it has answered 403.
export function originAllowed(
	req: IncomingMessage,
	res: ServerResponse,
	authorities: readonly string[],
): boolean {
	const { host } = req.headers
	if (!host || !authorities.includes(host)) {
		fail(res, {
			status: HTTP_FORBIDDEN,
			code: 'FORBIDDEN_HOST',
			error: `Host "${host ?? ''}" is not this hub.`,
			fix: 'Reach the hub at the origin it printed at start (or its --public-url).',
		})
		return false
	}
	if (!MUTATING_METHODS.has(req.method ?? '')) return true
	const { origin } = req.headers
	if (!origin || authorities.some(a => isOriginOf(origin, a))) return true
	fail(res, {
		status: HTTP_FORBIDDEN,
		code: 'FORBIDDEN_ORIGIN',
		error: `Cross-site request from origin "${origin}" is not allowed.`,
		fix: 'The hub only accepts same-origin requests.',
	})
	return false
}

// A reverse proxy terminates TLS, so a browser's Origin may spell the same authority with either
// scheme; the authority is what the guard pins.
function isOriginOf(origin: string, authority: string): boolean {
	return origin === `http://${authority}` || origin === `https://${authority}`
}
