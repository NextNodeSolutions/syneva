// The breaker's drain, a page at a time (RFC 6.5; the ops contract in contracts' ops.ts): one
// call drains at most OPS_LIMITS.drainPage people's objects, so the work an ops call does (its
// object requests, its D1 rows, its wall time) is bounded however many people there are, where
// one call draining every object would outgrow a Worker invocation and, cut short, leave no way
// to go on from where it stopped. A page is a range of user ids: `next` is the last id drained,
// and nothing is kept between calls, no queue and no timer; the ops caller follows the pages.
import { OPS_LIMITS } from '@syneva/contracts/ops'

import { readBreaker } from '../db/breaker.js'
import { isUserIdShape, userIdPage } from '../db/users.js'
import { fail, json } from '../http/answer.js'
import { readJson } from '../http/body.js'
import { HTTP_BAD_REQUEST, HTTP_CONFLICT, HTTP_OK } from '../http/status.js'
import { drainObject } from '../user-hub-stub.js'

import type { DrainPage } from '@syneva/contracts/ops'
import type { Call } from '../http/call.js'

export const OPS_BODY_BYTES = 4096
// The objects drained at once: a Worker keeps six connections open at a time.
const DRAIN_WIDTH = 6

export type Page = { after: string | null; limit: number }

// POST opsDrain { after?, limit? }, the breaker tripped.
export async function drainRoute(call: Call): Promise<Response> {
	const { env, request } = call
	const read = await readJson(request, OPS_BODY_BYTES)
	if ('refusal' in read) return read.refusal
	const page = drainRequest(read.parsed)
	if (!page)
		return fail({
			status: HTTP_BAD_REQUEST,
			code: 'INVALID_REQUEST',
			error: `Post { after?: <a page's next>, limit?: 1 to ${OPS_LIMITS.drainPage} }.`,
		})
	// A cleared breaker lets every socket back: draining then would close them for nothing.
	if (!(await readBreaker(env.DB)).tripped)
		return fail({
			status: HTTP_CONFLICT,
			code: 'NOT_TRIPPED',
			error: 'The breaker is not tripped: nothing to drain.',
		})
	return json(HTTP_OK, await drainPage(env, page))
}

export async function drainPage(env: Env, page: Page): Promise<DrainPage> {
	const { ids, hasMore } = await userIdPage(env.DB, page)
	await drainFrom(env, ids, 0)
	const last = ids.at(-1)
	if (!hasMore || !last) return { drained: ids.length, next: null }
	return { drained: ids.length, next: last }
}

// A page's size as asked: absent, the whole page; null when it is not 1 to drainPage.
export function limitOf(limit: unknown): number | null {
	if (typeof limit === 'undefined') return OPS_LIMITS.drainPage
	const isLimit =
		typeof limit === 'number' &&
		Number.isInteger(limit) &&
		limit >= 1 &&
		limit <= OPS_LIMITS.drainPage
	if (!isLimit) return null
	return limit
}

function drainRequest(parsed: unknown): Page | null {
	if (typeof parsed !== 'object' || parsed === null) return null
	const fields: Record<string, unknown> = Object.fromEntries(
		Object.entries(parsed),
	)
	const limit = limitOf(fields.limit)
	const { after } = fields
	if (limit === null) return null
	if (typeof after === 'undefined') return { after: null, limit }
	if (typeof after !== 'string' || !isUserIdShape(after)) return null
	return { after, limit }
}

async function drainFrom(env: Env, ids: string[], from: number): Promise<void> {
	const batch = ids.slice(from, from + DRAIN_WIDTH)
	if (!batch.length) return
	await Promise.all(batch.map(id => drainObject(env, id)))
	await drainFrom(env, ids, from + DRAIN_WIDTH)
}
