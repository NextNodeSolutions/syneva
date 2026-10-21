// Everything a session opens (RFC 4.7): who is signed in, their hubs, their settings, their tab's
// socket and the relay to their hubs. One D1 read checks the session before anything else is read
// or any object touched (R9); a mutation or an upgrade must also be same-origin. Pages are not
// here (routes/shells.ts): a signed-out navigation is sent to sign in, an API call gets 401.
import { BRIDGE_PATHS, isWebHubId } from '@syneva/contracts/bridge'
import { WEB_HUBS_PREFIX, WEB_PATHS } from '@syneva/contracts/web'

import { sessionOf } from '../auth/session.js'
import { hubsOfUser, revokeHubOfUser } from '../db/hubs.js'
import { fail, json, SIGNED_OUT } from '../http/answer.js'
import { isRead } from '../http/call.js'
import { isUpgrade, sameOriginRefusal } from '../http/guard.js'
import { HTTP_NOT_FOUND, HTTP_OK } from '../http/status.js'
import { onlineHubIds, openTabSocket, tellRevoked } from '../user-hub-stub.js'

import { upgradeRequired } from './hub-socket.js'
import { relayRoute } from './relay.js'
import { settingsRoute } from './settings.js'

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
	if (!call.url.pathname.startsWith(API_PREFIX)) return null
	const refused = sameOriginRefusal(call)
	if (refused) return refused
	const session = await sessionOf(call)
	if (!session) return fail(SIGNED_OUT)
	return (
		(await webApi(call, session)) ??
		(await settingsRoute(call, session)) ??
		(await tabSocket(call, session)) ??
		relayRoute(call, session)
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

// GET /api/hub/ws: the tab's socket, as a local hub serves it, with the person's live hubs.
async function tabSocket(
	call: Call,
	session: Session,
): Promise<Response | null> {
	const { request, url, env } = call
	if (url.pathname !== BRIDGE_PATHS.tabSocket || request.method !== 'GET')
		return null
	if (!isUpgrade(request)) return upgradeRequired()
	const hubs = await hubsOfUser(env.DB, session.userId)
	return openTabSocket(env, session.userId, hubs)
}
