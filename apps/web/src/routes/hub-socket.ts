// GET /bridge/v1/ws: a paired hub's socket (RFC 4.3). Its token as a Bearer, looked up by digest
// among the hubs not revoked (401 otherwise: the probe stops until `syneva login`), limited per
// hub; then one D1 write (when it connected, RFC 6.3 R3) and the upgrade handed to the person's
// object with who connects.
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'

import { limitRefusal } from '../auth/limits.js'
import { sha256Hex } from '../auth/secrets.js'
import { hubByTokenDigest, touchHub } from '../db/hubs.js'
import { fail } from '../http/answer.js'
import { bearerOf } from '../http/bearer.js'
import { iso } from '../http/call.js'
import { isUpgrade } from '../http/guard.js'
import { HTTP_UNAUTHORIZED, HTTP_UPGRADE_REQUIRED } from '../http/status.js'
import { openHubSocket } from '../user-hub-stub.js'

import type { Call } from '../http/call.js'

export async function hubSocketRoute(call: Call): Promise<Response | null> {
	const { request, url, env, now } = call
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
	await touchHub(env.DB, hub.id, now)
	return openHubSocket(env, { ...hub, lastSeenAt: iso(now) })
}

export function upgradeRequired(): Response {
	return fail({
		status: HTTP_UPGRADE_REQUIRED,
		code: 'UPGRADE_REQUIRED',
		error: 'This path is a WebSocket.',
	})
}
