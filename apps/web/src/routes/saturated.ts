// While the breaker is tripped (routes/ops.ts), every upgrade and relay is refused here, before any
// object is touched (RFC 6.5): an upgrade with 503 SATURATED, which a tab and a probe read as
// "wait five minutes" (a close code needs an accepted socket, which is an object call); a relay
// with 503 HUB_OFFLINE, the answer a tab already covers.
import { RELAY_FAILURE_STATUS } from '@syneva/contracts/bridge'

import { readBreaker } from '../db/breaker.js'
import { fail } from '../http/answer.js'
import { HTTP_UNAVAILABLE } from '../http/status.js'

import type { Failure } from '../http/answer.js'

const SATURATED: Failure = {
	status: HTTP_UNAVAILABLE,
	code: 'SATURATED',
	error: 'The web is shedding load; try again in a few minutes.',
}

const SHED_RELAY: Failure = {
	status: RELAY_FAILURE_STATUS.HUB_OFFLINE,
	code: 'HUB_OFFLINE',
	error: 'The web is shedding load: your hubs are out of reach for a few minutes.',
}

export async function saturatedRefusal(
	env: Env,
	what: 'upgrade' | 'relay',
): Promise<Response | null> {
	const breaker = await readBreaker(env.DB)
	if (!breaker.tripped) return null
	return fail(what === 'relay' ? SHED_RELAY : SATURATED)
}
