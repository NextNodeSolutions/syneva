// Everything a session opens (RFC 4.7): who is signed in, their hubs, their settings, their tab's
// socket and the relay to their hubs. One D1 read checks the session before anything else is read
// or any object touched (R9): the account's routes read it alone, the tab's socket and the relay
// read it with what they open (db/session-reads.ts), so each pays one round trip. A mutation or an
// upgrade must also be same-origin. Pages are not here (routes/shells.ts): a signed-out
// navigation is sent to sign in, an API call gets 401.
import { BRIDGE_PATHS, isWebHubId } from '@syneva/contracts/bridge'
import { WEB_HUBS_PREFIX, WEB_PATHS } from '@syneva/contracts/web'

import { limitRefusal } from '../auth/limits.js'
import { sessionByDigest, sessionDigest } from '../auth/session.js'
import { hubsOfUser, revokeHubOfUser } from '../db/hubs.js'
import { tabRead } from '../db/session-reads.js'
import { fail, json, SIGNED_OUT } from '../http/answer.js'
import { isRead } from '../http/call.js'
import { isUpgrade, sameOriginRefusal } from '../http/guard.js'
import { HTTP_NOT_FOUND, HTTP_OK } from '../http/status.js'
import { onlineHubIds, openTabSocket, tellRevoked } from '../user-hub-stub.js'

import { upgradeRequired } from './hub-socket.js'
import { relayRoute } from './relay.js'
import { sheddingRefusal } from './saturated.js'
import { isSettingsPath, settingsRoute } from './settings.js'

import type { WebHub, WebHubsAnswer, WebMe } from '@syneva/contracts/web'
import type { Session } from '../auth/session.js'
import type { Failure } from '../http/answer.js'
import type { Call } from '../http/call.js'

const API_PREFIX = '/api/'

const HUB_NOT_FOUND: Failure = {
	status: HTTP_NOT_FOUND,
	code: 'HUB_NOT_FOUND',
	error: 'No hub of yours has this id.',
	fix: `List your hubs with GET ${WEB_PATHS.hubs}.`,
}

export async function sessionRoute(call: Call): Promise<Response | null> {
	const { pathname } = call.url
	if (!pathname.startsWith(API_PREFIX)) return null
	const refused = sameOriginRefusal(call)
	if (refused) return refused
	const digest = await sessionDigest(call)
	if (!digest) return fail(SIGNED_OUT)
	if (pathname === BRIDGE_PATHS.tabSocket) return tabSocket(call, digest)
	if (!isAccountPath(pathname)) return relayRoute(call, digest)
	const session = await sessionByDigest(call, digest)
	if (!session) return fail(SIGNED_OUT)
	return (
		(await webApi(call, session)) ??
		(await settingsRoute(call, session)) ??
		relayRoute(call, digest)
	)
}

// The routes answered from the account's own rows, which need the session alone; a method none
// of them takes falls to the relay's refusal, as any route no hub answers.
function isAccountPath(pathname: string): boolean {
	return (
		pathname === WEB_PATHS.me ||
		pathname === WEB_PATHS.hubs ||
		pathname.startsWith(WEB_HUBS_PREFIX) ||
		isSettingsPath(pathname)
	)
}

async function webApi(call: Call, session: Session): Promise<Response | null> {
	const { request, url, env, now } = call
	const { pathname } = url
	if (pathname === WEB_PATHS.me && isRead(request)) {
		const me: WebMe = { userId: session.userId, email: session.email }
		return json(HTTP_OK, me)
	}
	if (pathname === WEB_PATHS.hubs && isRead(request))
		return json(HTTP_OK, await webHubs(env, session))
	if (!pathname.startsWith(WEB_HUBS_PREFIX) || request.method !== 'DELETE')
		return null
	const hubId = pathname.slice(WEB_HUBS_PREFIX.length)
	const ids = { userId: session.userId, hubId }
	if (!isWebHubId(hubId) || !(await revokeHubOfUser(env.DB, ids, now)))
		return fail(HUB_NOT_FOUND)
	await tellRevoked(env, ids)
	return json(HTTP_OK, { ok: true })
}

// The rows, with `online` from the object (it holds the sockets); the object is asked only when
// there is a hub to ask about.
async function webHubs(env: Env, session: Session): Promise<WebHubsAnswer> {
	const rows = await hubsOfUser(env.DB, session.userId)
	const online = rows.length
		? await onlineHubIds(env, session.userId)
		: new Set<string>()
	const hubs = rows.map((row): WebHub => ({
		id: row.id,
		name: row.name,
		version: row.version,
		online: online.has(row.id),
		pairedAt: row.createdAt,
		lastSeenAt: row.lastSeenAt,
	}))
	return { hubs }
}

// GET /api/hub/ws: the tab's socket, as a local hub serves it, with the person's live hubs, read
// with the session and the breaker. Every refusal comes before the upgrade is required: a tab
// learns why its upgrade failed from a plain GET of the same path (the frontend's stream.ts), so
// that GET passes the same guards, the limit included, and only then hears 426.
async function tabSocket(call: Call, digest: string): Promise<Response> {
	const { request, env, now } = call
	if (request.method !== 'GET') return relayRoute(call, digest)
	const read = await tabRead(env.DB, digest, now)
	if (!read) return fail(SIGNED_OUT)
	const limited = await limitRefusal(env, 'tab-socket', read.userId)
	if (limited) return limited
	const saturated = sheddingRefusal(read, 'upgrade')
	if (saturated) return saturated
	if (!isUpgrade(request)) return upgradeRequired()
	return openTabSocket(env, read.userId, read.hubs)
}
