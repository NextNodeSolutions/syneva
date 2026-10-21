// GET /auth/callback?token=: the emailed link followed. The token is taken once (used, unexpired,
// its follows bounded), the user created on a first sign-in (never before: an address nobody
// verified leaves no row), the session opened, and the browser sent where it was going. Anything
// else lands on the sign-in page's expired state.
import { WEB_PATHS } from '@syneva/contracts/web'

import { takeLoginCode } from '../db/login-codes.js'
import { ensureUser } from '../db/users.js'
import { seeOther } from '../http/answer.js'

import { sha256Hex } from './secrets.js'
import { openSession } from './session.js'

import type { Call } from '../http/call.js'

// A link followed more often than this (a mail scanner, a guess) no longer opens.
const MAX_FOLLOWS = 5
const MAX_TOKEN_LENGTH = 128

export async function followLink(call: Call): Promise<Response> {
	const { env, now, url } = call
	const token = url.searchParams.get('token') ?? ''
	const expired = seeOther(`${WEB_PATHS.login}?expired=1`)
	if (!token || token.length > MAX_TOKEN_LENGTH) return expired
	const taken = await takeLoginCode(env.DB, await sha256Hex(token), {
		now,
		maxAttempts: MAX_FOLLOWS,
	})
	if (!taken) return expired
	const user = await ensureUser(env.DB, taken.email, now)
	return seeOther(taken.next, await openSession(call, user.id))
}
