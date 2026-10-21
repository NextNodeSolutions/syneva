// The rate limiter binding (RFC 6.1 F1, F2, section 7): ten tries a minute per key, each key named
// by what it guards and who asks (a client address, a person, a hub), so one route's budget never
// spends another's. A refusal is a 429 in the error shape, before any D1 write or object call.
import { fail } from '../http/answer.js'
import { HTTP_TOO_MANY_REQUESTS } from '../http/status.js'

export type LimitScope = 'magic-link' | 'pairing' | 'device' | 'hub-socket'

// The address Cloudflare saw the request come from; wrangler dev sets it too.
export function clientAddress(request: Request): string {
	return request.headers.get('cf-connecting-ip') ?? 'unknown'
}

// Null when the try may proceed; else its 429.
export async function limitRefusal(
	env: Env,
	scope: LimitScope,
	who: string,
): Promise<Response | null> {
	const { success: isAllowed } = await env.RL_AUTH.limit({
		key: `${scope}:${who}`,
	})
	if (isAllowed) return null
	return fail({
		status: HTTP_TOO_MANY_REQUESTS,
		code: 'RATE_LIMITED',
		error: 'Too many tries; wait a minute.',
	})
}
