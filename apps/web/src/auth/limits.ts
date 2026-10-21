// The rate limiter bindings (RFC 6.1 F1, F2, section 7): RL_AUTH's ten tries a minute per key,
// each key named by what it guards and who asks (a client's host as client-keys.ts reads it, a
// person, a hub), so one route's budget never spends another's; a tab's upgrade on RL_TABS, sixty
// a minute per person (wrangler.jsonc says why). A refusal is a 429 in the error shape, before
// any object call.
import { fail } from '../http/answer.js'
import { HTTP_TOO_MANY_REQUESTS } from '../http/status.js'

export type LimitScope =
	| 'magic-link'
	| 'pairing'
	| 'device'
	| 'hub-socket'
	| 'tab-socket'

// Null when the try may proceed; else its 429.
export async function limitRefusal(
	env: Env,
	scope: LimitScope,
	who: string,
): Promise<Response | null> {
	const limiter = scope === 'tab-socket' ? env.RL_TABS : env.RL_AUTH
	const { success: isAllowed } = await limiter.limit({
		key: `${scope}:${who}`,
	})
	if (isAllowed) return null
	return fail({
		status: HTTP_TOO_MANY_REQUESTS,
		code: 'RATE_LIMITED',
		error: 'Too many tries; wait a minute.',
	})
}
