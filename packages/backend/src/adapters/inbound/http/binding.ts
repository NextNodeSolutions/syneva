import { HTTP_FORBIDDEN, fail } from './http.js'

import type { IncomingMessage, ServerResponse } from 'node:http'

// IPv6 is the only host that needs bracketing: leave names, IPv4 and already-bracketed literals untouched.
function urlHost(host: string): string {
	return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
}

// The loopback authorities are always trusted and a non-loopback bind EXTENDS the set (never replaces it), so the same-machine CLI, which talks to 127.0.0.1 regardless of bind address, keeps working.
const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '[::1]'] as const
// Host strings meaning this machine's loopback (no widening) and every interface (a wildcard bind has no single address to advertise, so loopback still reaches it).
const LOOPBACK_BINDS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])
const WILDCARD_BINDS = new Set(['0.0.0.0', '::', '[::]'])
// An allowed-hosts entry naming its own port is a complete authority: trusted as spelled, never re-suffixed with the bound port.
const AUTHORITY_WITH_PORT = /^(\[[^\]]+\]|[^:]+):\d+$/
// HTTP methods that change state must also pass the Origin check (a cross-site page can trigger them with a form or fetch; a GET only reads).
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export type Binding = {
	browserHost: string
	lockHost: string
	allowedHosts: string[]
	extraAuthorities: string[]
}

export function isLoopbackHost(host: string): boolean {
	return LOOPBACK_BINDS.has(host)
}

// Derive the browser-URL host, lock-URL host and origin-guard authorities from the bind address
// (pure, so exotic binds are testable without binding). The default adds nothing to the loopback
// authority set and keeps both URLs on 127.0.0.1; a wildcard advertises the machine's hostname
// but keeps the lock on loopback; a specific non-loopback bind uses that exact address for both.
// os.hostname(), SYNEVA_ALLOWED_HOSTS (a MagicDNS FQDN differs from the short hostname) and a
// configured public URL widen the guard.
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

export function authoritiesFor(binding: Binding, port: number): string[] {
	return [
		...binding.allowedHosts.map(host => `${host}:${port}`),
		...binding.extraAuthorities,
	]
}

// Lock the hub to its own trusted origins: the FIXED port makes the origin guessable, so without
// this any open page could POST the state-changing routes (/reset wipes a review, /shutdown
// closes a desk) or read a diff off-machine. The Host check defeats DNS-rebinding; the Origin
// check blocks cross-site mutations; header-less callers (curl, the syneva CLI) stay allowed.
// Returns false once it has answered 403.
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

// A reverse proxy terminates TLS, so a browser's Origin may spell the same authority with either scheme; the authority is what the guard pins.
function isOriginOf(origin: string, authority: string): boolean {
	return origin === `http://${authority}` || origin === `https://${authority}`
}
