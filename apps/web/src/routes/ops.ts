// The ops routes (RFC 6.5; the contract in contracts' ops.ts): control-center's budget agent trips
// and clears the breaker here, follows its drain a page at a time (ops-drain.ts), and reads what
// it compares its thresholds against. A Bearer OPS_TOKEN, compared in constant time; anything
// else is 403 before D1 is read. Tripping drains the first page of the people's objects (each
// socket closes with `saturated`, its relays fail), and from the moment the row is written the
// Worker refuses every upgrade and relay with 503 before any object is touched, so the pages
// still to drain hold only what was already open.
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'
import { OPS_LIMITS } from '@syneva/contracts/ops'

import { isSameSecret } from '../auth/secrets.js'
import { readBreaker, setBreaker, userCount } from '../db/breaker.js'
import { hubsSeenLastDay } from '../db/hubs.js'
import { fail, json } from '../http/answer.js'
import { bearerOf } from '../http/bearer.js'
import { readJson } from '../http/body.js'
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_OK } from '../http/status.js'

import { drainPage, drainRoute, limitOf, OPS_BODY_BYTES } from './ops-drain.js'

import type { BreakerAnswer, OpsStatus } from '@syneva/contracts/ops'
import type { Call } from '../http/call.js'

// A BreakerRequest as read: the reason cut to its length, the page's size given.
type BreakerAsk = { tripped: boolean; reason: string | null; limit: number }

const OPS_ROUTES: ReadonlyMap<string, (call: Call) => Promise<Response>> =
	new Map([
		[`POST ${BRIDGE_PATHS.opsBreaker}`, setTheBreaker],
		[`POST ${BRIDGE_PATHS.opsDrain}`, drainRoute],
		[`GET ${BRIDGE_PATHS.opsStatus}`, status],
	])

export async function opsRoute(call: Call): Promise<Response | null> {
	const route = OPS_ROUTES.get(`${call.request.method} ${call.url.pathname}`)
	if (!route) return null
	if (!(await isSameSecret(bearerOf(call.request), call.env.OPS_TOKEN)))
		return fail({
			status: HTTP_FORBIDDEN,
			code: 'FORBIDDEN',
			error: 'Not an ops token.',
		})
	return route(call)
}

async function setTheBreaker(call: Call): Promise<Response> {
	const { env, now, request } = call
	const read = await readJson(request, OPS_BODY_BYTES)
	if ('refusal' in read) return read.refusal
	const ask = breakerRequest(read.parsed)
	if (!ask)
		return fail({
			status: HTTP_BAD_REQUEST,
			code: 'INVALID_REQUEST',
			error: `Post { tripped: boolean, reason?: string, limit?: 1 to ${OPS_LIMITS.drainPage} }.`,
		})
	await setBreaker(env.DB, ask, now)
	// The row first: every upgrade from here on is refused, so a page drained stays drained.
	const page = ask.tripped
		? await drainPage(env, { after: null, limit: ask.limit })
		: { drained: 0, next: null }
	const answer: BreakerAnswer = { ...(await readBreaker(env.DB)), ...page }
	return json(HTTP_OK, answer)
}

async function status({ env, now }: Call): Promise<Response> {
	const [breaker, seen, users] = await Promise.all([
		readBreaker(env.DB),
		hubsSeenLastDay(env.DB, now),
		userCount(env.DB),
	])
	const answer: OpsStatus = { ...breaker, hubsSeenLastDay: seen, users }
	return json(HTTP_OK, answer)
}

function breakerRequest(parsed: unknown): BreakerAsk | null {
	if (typeof parsed !== 'object' || parsed === null) return null
	const fields: Record<string, unknown> = Object.fromEntries(
		Object.entries(parsed),
	)
	const { tripped, reason } = fields
	const limit = limitOf(fields.limit)
	if (typeof tripped !== 'boolean' || limit === null) return null
	if (typeof reason === 'undefined') return { tripped, reason: null, limit }
	if (typeof reason !== 'string') return null
	return {
		tripped,
		reason: reason.slice(0, OPS_LIMITS.reasonChars),
		limit,
	}
}
