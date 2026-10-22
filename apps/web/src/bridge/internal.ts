// What the Worker says to the object, and how: the object's own paths, the headers that name
// who asks, and the one header the object answers with. Only the Worker reaches an object (a
// Durable Object has no public route), and it builds every request it sends one from scratch,
// never forwarding the client's, so a client header of the same name never arrives; the object
// answers 400 to a request without its user. Shared by both sides; the object imports nothing
// else of the Worker's.
import type { RelayMethod } from '@syneva/contracts/bridge'

export const OBJECT_ORIGIN = 'https://user-hub.internal'

export const OBJECT_PATHS = {
	// Upgrades: a hub's socket, a tab's.
	hub: '/hub',
	tab: '/tab',
	// POST, the `req` as JSON (RelayAsk): the hub's answer streams back.
	relay: '/relay',
	// POST /cancel/<relay id>: the Worker's deadline passed, or its client left.
	cancel: '/cancel/',
	// POST /revoke/<hub id>: its socket closes with `revoked`.
	revoke: '/revoke/',
	// POST: every socket closes with `saturated` (the breaker).
	drain: '/drain',
	// GET: the ids of the hubs whose socket is open (HubsOnline).
	hubs: '/hubs',
} as const

export const OBJECT_HEADERS = {
	// The person the object is (it is named after their id).
	user: 'x-syneva-object-user',
	// `/hub`: the hub opening its socket (HubCard, encoded).
	hub: 'x-syneva-object-hub',
	// `/tab`: every live hub of the person (HubCard[], encoded): the object stores none.
	hubs: 'x-syneva-object-hubs',
	// On `/hub`'s 101: when the object accepted the hub's socket, which the Worker writes as the
	// hub's `last_seen_at`. An upgrade it refuses (TOO_MANY_STATUS) has neither socket nor write.
	connectedAt: 'x-syneva-object-connected-at',
} as const

// A hub as a tab's `hub` frame shows it, from its row: `lastSeenAt` is when it last connected.
export type HubCard = {
	hubId: string
	name: string
	version: string
	lastSeenAt: string | null
}

// The relay the Worker asks for: the id it drew (so it can cancel it), the hub, the request.
export type RelayAsk = {
	id: string
	hubId: string
	method: RelayMethod
	path: string
	query: string
	body?: string | undefined
}

export type HubsOnline = { online: string[] }

// A header's value is a byte string: JSON goes as the base64 of its UTF-8, a hub's name may be
// any text.
export function encodeHeader(carried: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(carried))
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary)
}

// Null when the header is absent or does not decode.
export function decodeHeader(header: string | null): unknown {
	if (!header) return null
	try {
		const binary = atob(header)
		const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
		return JSON.parse(new TextDecoder().decode(bytes))
	} catch {
		return null
	}
}

export function isHubCard(decoded: unknown): decoded is HubCard {
	if (typeof decoded !== 'object' || decoded === null) return false
	const card: Partial<Record<keyof HubCard, unknown>> = decoded
	return (
		typeof card.hubId === 'string' &&
		typeof card.name === 'string' &&
		typeof card.version === 'string' &&
		(card.lastSeenAt === null || typeof card.lastSeenAt === 'string')
	)
}

export function isRelayAsk(posted: unknown): posted is RelayAsk {
	if (typeof posted !== 'object' || posted === null) return false
	const ask: Partial<Record<keyof RelayAsk, unknown>> = posted
	return (
		typeof ask.id === 'string' &&
		typeof ask.hubId === 'string' &&
		(ask.method === 'GET' ||
			ask.method === 'POST' ||
			ask.method === 'DELETE') &&
		typeof ask.path === 'string' &&
		typeof ask.query === 'string' &&
		['undefined', 'string'].includes(typeof ask.body)
	)
}
