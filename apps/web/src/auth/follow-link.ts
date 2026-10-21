// /auth/callback: the emailed link, in two steps. GET ?token= only reads: it names the account the
// link signs in as and shows one button, so a mail scanner or a link preview that fetches it spends
// nothing, and a person sent a link someone else asked for sees whose account it opens before
// signing in to it. The button POSTs the token (same origin): it is taken once (used, unexpired,
// its tries bounded), the user created on a first sign-in (never before: an address nobody
// verified leaves no row), the session opened, and the browser sent where it was going. Anything
// else, on either step, lands on the sign-in page's expired state.
import { WEB_PATHS } from '@syneva/contracts/web'

import { peekLoginCode, takeLoginCode } from '../db/login-codes.js'
import { ensureUser } from '../db/users.js'
import { html, seeOther } from '../http/answer.js'
import { HTTP_OK } from '../http/status.js'
import { signInPage } from '../pages/sign-in.js'

import { readPosted } from './form.js'
import { sha256Hex } from './secrets.js'
import { openSession } from './session.js'

import type { Call } from '../http/call.js'

// A link posted more often than this (a guess, a replay) no longer opens.
const MAX_FOLLOWS = 5
const MAX_TOKEN_LENGTH = 128

// GET: the confirmation page, the row untouched.
export async function showLink(call: Call): Promise<Response> {
	const { env, now, url } = call
	const token = tokenOf(url.searchParams.get('token'))
	if (!token) return expired()
	const email = await peekLoginCode(env.DB, await sha256Hex(token), {
		now,
		maxAttempts: MAX_FOLLOWS,
	})
	if (email === null) return expired()
	return html(HTTP_OK, signInPage({ kind: 'confirm', email, token }))
}

// POST (same-origin, checked by the route): the token taken, the session opened.
export async function followLink(call: Call): Promise<Response> {
	const { env, now, request } = call
	const posted = await readPosted(request)
	if ('refusal' in posted) return posted.refusal
	const token = tokenOf(posted.fields.get('token'))
	if (!token) return expired()
	const taken = await takeLoginCode(env.DB, await sha256Hex(token), {
		now,
		maxAttempts: MAX_FOLLOWS,
	})
	if (!taken) return expired()
	const user = await ensureUser(env.DB, taken.email, now)
	return seeOther(taken.next, await openSession(call, user.id))
}

function tokenOf(given: string | null | undefined): string | null {
	if (!given || given.length > MAX_TOKEN_LENGTH) return null
	return given
}

function expired(): Response {
	return seeOther(`${WEB_PATHS.login}?expired=1`)
}
