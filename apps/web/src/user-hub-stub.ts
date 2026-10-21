// The Worker's side of bridge/internal.ts: every call it makes to a person's object, each a
// request it builds itself (never the client's, so no client header reaches the object), named
// after the person's id. Every call here is one billed object request (RFC 6.1): the routes make
// one only once the session, the hub and the breaker allow it.
import {
	encodeHeader,
	OBJECT_HEADERS,
	OBJECT_ORIGIN,
	OBJECT_PATHS,
} from './bridge/internal.js'

import type { HubCard, RelayAsk } from './bridge/internal.js'
import type { HubRow } from './db/hubs.js'

function stubOf(env: Env, userId: string): DurableObjectStub {
	return env.USER_HUB.getByName(userId)
}

function ask(
	env: Env,
	userId: string,
	path: string,
	init: {
		method: string
		headers?: Record<string, string>
		body?: string
		signal?: AbortSignal
	},
): Promise<Response> {
	const request = new Request(new URL(path, OBJECT_ORIGIN), {
		method: init.method,
		headers: { ...init.headers, [OBJECT_HEADERS.user]: userId },
		body: init.body ?? null,
		signal: init.signal ?? null,
	})
	return stubOf(env, userId).fetch(request)
}

export function cardOf(hub: HubRow): HubCard {
	return {
		hubId: hub.id,
		name: hub.name,
		version: hub.version,
		lastSeenAt: hub.lastSeenAt,
	}
}

// A hub's socket: the object answers 101 with it, or closes it at once over the cap.
export function openHubSocket(env: Env, hub: HubRow): Promise<Response> {
	return ask(env, hub.userId, OBJECT_PATHS.hub, {
		method: 'GET',
		headers: {
			upgrade: 'websocket',
			[OBJECT_HEADERS.hub]: encodeHeader(cardOf(hub)),
		},
	})
}

// A tab's socket, with the person's live hubs (their `hub` frames: the object stores none).
export function openTabSocket(
	env: Env,
	userId: string,
	hubs: readonly HubRow[],
): Promise<Response> {
	return ask(env, userId, OBJECT_PATHS.tab, {
		method: 'GET',
		headers: {
			upgrade: 'websocket',
			[OBJECT_HEADERS.hubs]: encodeHeader(hubs.map(cardOf)),
		},
	})
}

export function relayThrough(
	env: Env,
	userId: string,
	relay: RelayAsk,
	signal: AbortSignal,
): Promise<Response> {
	return ask(env, userId, OBJECT_PATHS.relay, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(relay),
		signal,
	})
}

export async function cancelRelay(
	env: Env,
	userId: string,
	id: string,
): Promise<void> {
	await ask(env, userId, `${OBJECT_PATHS.cancel}${encodeURIComponent(id)}`, {
		method: 'POST',
	})
}

export async function tellRevoked(
	env: Env,
	ids: { userId: string; hubId: string },
): Promise<void> {
	const answer = await ask(
		env,
		ids.userId,
		`${OBJECT_PATHS.revoke}${ids.hubId}`,
		{
			method: 'POST',
		},
	)
	if (!answer.ok)
		throw new Error(`the object answered ${answer.status} to a revoke`)
}

export async function drainObject(env: Env, userId: string): Promise<void> {
	await ask(env, userId, OBJECT_PATHS.drain, { method: 'POST' })
}

export async function onlineHubIds(
	env: Env,
	userId: string,
): Promise<Set<string>> {
	const answer = await ask(env, userId, OBJECT_PATHS.hubs, { method: 'GET' })
	const answered: unknown = await answer.json()
	if (
		typeof answered !== 'object' ||
		answered === null ||
		!('online' in answered)
	)
		return new Set()
	const { online }: { online: unknown } = answered
	if (!Array.isArray(online)) return new Set()
	return new Set(
		online.filter((id: unknown): id is string => typeof id === 'string'),
	)
}
