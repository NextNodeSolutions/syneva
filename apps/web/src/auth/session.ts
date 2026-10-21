// The session: a random 32-byte id in an HttpOnly cookie, kept in D1 as HMAC-SHA256(SESSION_SECRET,
// id), so a database dump alone opens nothing (RFC 7). One D1 read checks it, before any object is
// touched (RFC 6.3, R9).
import { WEB_SESSION_COOKIE, WEB_SESSION_DAYS } from '@syneva/contracts/web'

import { deleteSession, insertSession, sessionUser } from '../db/sessions.js'
import { secondsAfter } from '../http/call.js'

import { hmacHex, randomToken } from './secrets.js'

import type { SessionUser } from '../db/sessions.js'
import type { Call } from '../http/call.js'

const SECONDS_PER_DAY = 86_400
const SESSION_SECONDS = WEB_SESSION_DAYS * SECONDS_PER_DAY

// `digest` names this browser's session (the row's key) to what binds an act to it (the device
// page's approval proof).
export type Session = SessionUser & { digest: string }

// The session's cookie value, if the request carries one; nothing is checked yet.
export function sessionCookie(request: Request): string | null {
	const header = request.headers.get('cookie')
	if (!header) return null
	for (const part of header.split(';')) {
		const [name = '', ...rest] = part.trim().split('=')
		if (name === WEB_SESSION_COOKIE) return rest.join('=') || null
	}
	return null
}

// What the cookie's session is kept under, the key every session read joins on; null without a
// cookie, with nothing read.
export async function sessionDigest({
	request,
	env,
}: Call): Promise<string | null> {
	const id = sessionCookie(request)
	if (!id) return null
	return hmacHex(env.SESSION_SECRET, id)
}

// The signed-in person, or null: absent, unknown or expired.
export async function sessionOf(call: Call): Promise<Session | null> {
	const digest = await sessionDigest(call)
	if (!digest) return null
	return sessionByDigest(call, digest)
}

// The session under `digest` (sessionDigest's), or null: unknown or expired.
export async function sessionByDigest(
	{ env, now }: Call,
	digest: string,
): Promise<Session | null> {
	const user = await sessionUser(env.DB, digest, now)
	if (!user) return null
	return { ...user, digest }
}

// A new session for this person: its row, and the Set-Cookie header that hands it over.
export async function openSession(
	{ env, now }: Call,
	userId: string,
): Promise<string> {
	const id = randomToken()
	await insertSession(
		env.DB,
		{
			digest: await hmacHex(env.SESSION_SECRET, id),
			userId,
			expiresAt: secondsAfter(now, SESSION_SECONDS),
		},
		now,
	)
	return cookieHeader(env, id, SESSION_SECONDS)
}

// The request's session ended (its row gone); the Set-Cookie header that clears it.
export async function closeSession({ request, env }: Call): Promise<string> {
	const id = sessionCookie(request)
	if (id) await deleteSession(env.DB, await hmacHex(env.SESSION_SECRET, id))
	return cookieHeader(env, '', 0)
}

// Secure everywhere but a local http origin (wrangler dev), where a browser would drop it.
function cookieHeader(
	env: Env,
	sessionId: string,
	maxAgeSeconds: number,
): string {
	const attributes = [
		`${WEB_SESSION_COOKIE}=${sessionId}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${maxAgeSeconds}`,
	]
	if (new URL(env.SITE_URL).protocol === 'https:') attributes.push('Secure')
	return attributes.join('; ')
}
