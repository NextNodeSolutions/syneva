// The ops routes (RFC 6.5): control-center's budget agent trips and clears the breaker here, and
// reads what it compares its thresholds against. A Bearer OPS_TOKEN, compared in constant time;
// anything else is 403 before D1 is read. Tripping drains every person's object (each socket
// closes with `saturated`, its relays fail), and while the breaker is tripped the Worker refuses
// every upgrade and relay with 503 before any object is touched.
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'

import { isSameSecret } from '../auth/secrets.js'
import { readBreaker, setBreaker, userCount } from '../db/breaker.js'
import { hubsSeenLastDay } from '../db/hubs.js'
import { userIds } from '../db/users.js'
import { fail, json } from '../http/answer.js'
import { bearerOf } from '../http/bearer.js'
import { readJson } from '../http/body.js'
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_OK } from '../http/status.js'
import { drainObject } from '../user-hub-stub.js'

import type { Call } from '../http/call.js'

const OPS_BODY_BYTES = 4096
const MAX_REASON_LENGTH = 500
// The objects drained at once: a Worker keeps six connections open at a time.
const DRAIN_WIDTH = 6

export type BreakerRequest = { tripped: boolean; reason?: string | undefined }

export async function opsRoute(call: Call): Promise<Response | null> {
	const { request, url } = call
	const isBreaker =
		url.pathname === BRIDGE_PATHS.opsBreaker && request.method === 'POST'
	const isStatus =
		url.pathname === BRIDGE_PATHS.opsStatus && request.method === 'GET'
	if (!isBreaker && !isStatus) return null
	if (!(await isSameSecret(bearerOf(request), call.env.OPS_TOKEN)))
		return fail({
			status: HTTP_FORBIDDEN,
			code: 'FORBIDDEN',
			error: 'Not an ops token.',
		})
	return isBreaker ? setTheBreaker(call) : status(call)
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
			error: 'Post { tripped: boolean, reason?: string }.',
		})
	await setBreaker(
		env.DB,
		{
			tripped: ask.tripped,
			reason: ask.reason?.slice(0, MAX_REASON_LENGTH) ?? null,
		},
		now,
	)
	const drained = ask.tripped ? await drainAll(env) : 0
	return json(HTTP_OK, { ...(await readBreaker(env.DB)), drained })
}

async function status({ env, now }: Call): Promise<Response> {
	const [breaker, seen, users] = await Promise.all([
		readBreaker(env.DB),
		hubsSeenLastDay(env.DB, now),
		userCount(env.DB),
	])
	return json(HTTP_OK, { ...breaker, hubsSeenLastDay: seen, users })
}

// Every person's object, a few at a time: bounded by the number of users (one request each).
async function drainAll(env: Env): Promise<number> {
	const ids = await userIds(env.DB)
	await drainFrom(env, ids, 0)
	return ids.length
}

async function drainFrom(env: Env, ids: string[], from: number): Promise<void> {
	const batch = ids.slice(from, from + DRAIN_WIDTH)
	if (!batch.length) return
	await Promise.all(batch.map(id => drainObject(env, id)))
	await drainFrom(env, ids, from + DRAIN_WIDTH)
}

function breakerRequest(parsed: unknown): BreakerRequest | null {
	if (typeof parsed !== 'object' || parsed === null) return null
	if (!('tripped' in parsed) || typeof parsed.tripped !== 'boolean')
		return null
	if (!('reason' in parsed)) return { tripped: parsed.tripped }
	const { reason } = parsed
	if (!['undefined', 'string'].includes(typeof reason)) return null
	return {
		tripped: parsed.tripped,
		reason: typeof reason === 'string' ? reason : undefined,
	}
}
