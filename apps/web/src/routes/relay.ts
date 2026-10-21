// The HTTP relay, the Worker's half (RFC 4.5): any other /api/ request a session opens goes to one
// of the person's hubs as a `req` through their object, if the hub may answer it at all. Checked
// here, in order, before the object is touched: the route is one a hub answers to the web
// (contracts' isRelayable), the hub it names is the person's (by the web id's prefix in the path,
// else the tab's pick in WEB_HUB_HEADER), the body is under `requestBodyBytes`, the breaker is not
// tripped. The relay is bounded by `deadlineMs`: past it, the object is told to cancel and the tab
// gets 504.
import {
	BRIDGE_LIMITS,
	RELAY_FAILURE_STATUS,
	splitWebDeskId,
	WEB_HUB_HEADER,
} from '@syneva/contracts/bridge'
import { isRelayable } from '@syneva/contracts/relay'
import { DESK_API_PREFIX, HUB_PATHS } from '@syneva/contracts/routes'

import { hubOfUser } from '../db/hubs.js'
import { fail } from '../http/answer.js'
import { readText } from '../http/body.js'
import { logFailure } from '../http/log.js'
import { HTTP_NOT_FOUND } from '../http/status.js'
import { cancelRelay, relayThrough } from '../user-hub-stub.js'

import { saturatedRefusal } from './saturated.js'

import type { RelayMethod } from '@syneva/contracts/bridge'
import type { Session } from '../auth/session.js'
import type { Failure } from '../http/answer.js'
import type { Call } from '../http/call.js'

// The routes that name a desk or a plan by its web id, right after their prefix (as the probe's
// relay-target.ts reads them).
const ID_PREFIXES = [
	DESK_API_PREFIX,
	`${HUB_PATHS.desks}/`,
	`${HUB_PATHS.plans}/`,
]

const NOT_RELAYED: Failure = {
	status: HTTP_NOT_FOUND,
	code: 'NOT_RELAYED',
	error: 'No hub answers this route on the web.',
}
const NO_SUCH_HUB: Failure = {
	status: HTTP_NOT_FOUND,
	code: 'HUB_NOT_FOUND',
	error: 'This request names no hub of yours.',
	fix: `Name a desk by its web id, or the hub in the ${WEB_HUB_HEADER} header.`,
}

export async function relayRoute(
	call: Call,
	session: Session,
): Promise<Response> {
	const { request, url, env } = call
	const method = relayMethod(request.method)
	if (!method || !isRelayable(method, url.pathname)) return fail(NOT_RELAYED)
	const hubId = hubNamed(url.pathname, request.headers)
	const hub = hubId ? await hubOfUser(env.DB, session.userId, hubId) : null
	if (!hub) return fail(NO_SUCH_HUB)
	const read = await readText(request, BRIDGE_LIMITS.requestBodyBytes)
	if ('refusal' in read) return read.refusal
	const saturated = await saturatedRefusal(env, 'relay')
	if (saturated) return saturated
	const id = crypto.randomUUID()
	const deadline = AbortSignal.timeout(BRIDGE_LIMITS.deadlineMs)
	try {
		return await relayThrough(
			env,
			session.userId,
			{
				id,
				hubId: hub.id,
				method,
				path: url.pathname,
				query: url.search,
				body: read.text || undefined,
			},
			AbortSignal.any([deadline, request.signal]),
		)
	} catch (error) {
		if (!deadline.aborted && !request.signal.aborted) throw error
		// The object still holds the relay: it frees it and tells the hub, after this answer.
		call.ctx.waitUntil(cancelQuietly(env, session.userId, id))
		return fail({
			status: RELAY_FAILURE_STATUS.HUB_TIMEOUT,
			code: 'HUB_TIMEOUT',
			error: 'The hub did not answer in time.',
		})
	}
}

function relayMethod(method: string): RelayMethod | null {
	if (method !== 'GET' && method !== 'POST' && method !== 'DELETE')
		return null
	return method
}

async function cancelQuietly(
	env: Env,
	userId: string,
	id: string,
): Promise<void> {
	try {
		await cancelRelay(env, userId, id)
	} catch (error) {
		logFailure('relay-cancel', error)
	}
}

// The hub a path names by its web id; a hub-level route (open a desk, the inventory, the plans)
// names it in the header instead.
function hubNamed(pathname: string, headers: Headers): string | null {
	const prefix = ID_PREFIXES.find(each => pathname.startsWith(each))
	if (!prefix) return headers.get(WEB_HUB_HEADER)
	const [webId = ''] = pathname.slice(prefix.length).split('/')
	return splitWebDeskId(webId)?.hubId ?? null
}
