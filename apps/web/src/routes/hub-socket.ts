// GET /bridge/v1/ws: a paired hub's socket (RFC 4.3). Its token as a Bearer, looked up by digest
// among the hubs not revoked (401 otherwise: the probe stops until `syneva login`), limited per
// hub, refused while the breaker is tripped; then the upgrade handed to the person's object with
// who connects, and one D1 write (when it connected, RFC 6.3 R3) once the object accepted it.
import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	TOO_MANY_STATUS,
} from '@syneva/contracts/bridge'

import { limitRefusal } from '../auth/limits.js'
import { sha256Hex } from '../auth/secrets.js'
import { OBJECT_HEADERS } from '../bridge/internal.js'
import { hubByTokenDigest, touchHub } from '../db/hubs.js'
import { fail } from '../http/answer.js'
import { bearerOf } from '../http/bearer.js'
import { isUpgrade } from '../http/guard.js'
import { logFailure } from '../http/log.js'
import { HTTP_UNAUTHORIZED, HTTP_UPGRADE_REQUIRED } from '../http/status.js'
import { openHubSocket } from '../user-hub-stub.js'

import { saturatedRefusal } from './saturated.js'

import type { Failure } from '../http/answer.js'
import type { Call } from '../http/call.js'

// Past `hubsPerUser` connected, the object accepts no socket and answers TOO_MANY_STATUS (the
// contract says why a close could not): the hub reads the status, this is for whoever reads more.
const HUBS_FULL: Failure = {
	status: TOO_MANY_STATUS,
	code: 'TOO_MANY_HUBS',
	error: `${BRIDGE_LIMITS.hubsPerUser} hubs of this account are connected already.`,
	fix: 'This hub tries again every minute and connects once one of them disconnects.',
}

export async function hubSocketRoute(call: Call): Promise<Response | null> {
	const { request, url, env } = call
	if (url.pathname !== BRIDGE_PATHS.hubSocket || request.method !== 'GET')
		return null
	if (!isUpgrade(request)) return upgradeRequired()
	const token = bearerOf(request)
	const hub = token
		? await hubByTokenDigest(env.DB, await sha256Hex(token))
		: null
	// A token is 32 random bytes: an unknown one costs one D1 read, and the edge's rule bounds those.
	if (!hub)
		return fail({
			status: HTTP_UNAUTHORIZED,
			code: 'UNAUTHORIZED',
			error: 'This token opens no hub.',
			fix: 'Run `syneva login` to pair this hub again.',
		})
	// Its reconnects, whatever its backoff does: ten a minute.
	const limited = await limitRefusal(env, 'hub-socket', hub.id)
	if (limited) return limited
	const saturated = await saturatedRefusal(env, 'upgrade')
	if (saturated) return saturated
	return connected(call, await openHubSocket(env, hub), hub.id)
}

// The object's answer, handed on without its own header. It names when the object accepted the
// socket, and only then is `last_seen_at` written, at that time: a hub refused because
// `hubsPerUser` of the person's hubs are connected (it tries again every minute) costs no write
// and never reads as connected. The write goes after the answer: the socket is the person's
// already, and a failed write only leaves the previous time.
function connected(
	{ env, ctx }: Call,
	answer: Response,
	hubId: string,
): Response {
	if (answer.status === TOO_MANY_STATUS) return fail(HUBS_FULL)
	const { webSocket } = answer
	if (!webSocket) return answer
	const connectedAt = answer.headers.get(OBJECT_HEADERS.connectedAt)
	if (connectedAt) ctx.waitUntil(lastSeen(env, hubId, connectedAt))
	return new Response(null, { status: answer.status, webSocket })
}

async function lastSeen(env: Env, hubId: string, at: string): Promise<void> {
	try {
		await touchHub(env.DB, hubId, at)
	} catch (error) {
		logFailure('last-seen', error)
	}
}

export function upgradeRequired(): Response {
	return fail({
		status: HTTP_UPGRADE_REQUIRED,
		code: 'UPGRADE_REQUIRED',
		error: 'This path is a WebSocket.',
	})
}
