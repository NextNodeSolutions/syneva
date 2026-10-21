// Sign-in by magic link (contracts/web.ts): the page, the request for a link, the link followed,
// sign-out. A link is a random token emailed once (kept as its sha256), good for one use within
// MAGIC_LINK_MINUTES; following it creates the user on a first sign-in and opens the session.
import { MAGIC_LINK_MINUTES, WEB_PATHS } from '@syneva/contracts/web'

import { insertLoginCode, linkCounts } from '../db/login-codes.js'
import { fail, html, json, seeOther } from '../http/answer.js'
import { isRead, secondsAfter } from '../http/call.js'
import { sameOriginRefusal } from '../http/guard.js'
import { logFailure } from '../http/log.js'
import {
	HTTP_ACCEPTED,
	HTTP_BAD_GATEWAY,
	HTTP_BAD_REQUEST,
	HTTP_OK,
	HTTP_TOO_MANY_REQUESTS,
} from '../http/status.js'
import { signInPage } from '../pages/sign-in.js'
import { signOutPage } from '../pages/sign-out.js'

import { followLink } from './follow-link.js'
import { readPosted } from './form.js'
import { clientAddress, limitRefusal } from './limits.js'
import { sendSignInEmail } from './mail.js'
import { safeNext } from './next-path.js'
import { randomToken, sha256Hex } from './secrets.js'
import { closeSession, sessionOf } from './session.js'

import type { Failure } from '../http/answer.js'
import type { Call } from '../http/call.js'

const SECONDS_PER_MINUTE = 60
// RFC 6.1 F1: per address and per client address an hour, all addresses a day.
const LINKS_PER_ADDRESS_HOUR = 3
const LINKS_PER_CLIENT_HOUR = 10
const LINKS_PER_DAY = 2000
const MAX_EMAIL_LENGTH = 254
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Null when the path is none of sign-in's.
export async function signInRoute(call: Call): Promise<Response | null> {
	const { request, url } = call
	const { pathname } = url
	if (pathname === WEB_PATHS.login && isRead(request)) return loginPage(call)
	if (pathname === WEB_PATHS.magicLink && request.method === 'POST')
		return sameOriginRefusal(call) ?? requestLink(call)
	if (pathname === WEB_PATHS.authCallback && isRead(request))
		return followLink(call)
	if (pathname !== WEB_PATHS.logout) return null
	if (request.method === 'POST')
		return sameOriginRefusal(call) ?? signOut(call)
	if (isRead(request)) return signOutConfirm(call)
	return null
}

async function loginPage(call: Call): Promise<Response> {
	const { searchParams } = call.url
	const next = safeNext(searchParams.get('next'))
	if (searchParams.has('sent'))
		return html(HTTP_OK, signInPage({ kind: 'sent' }))
	if (searchParams.has('expired'))
		return html(HTTP_OK, signInPage({ kind: 'expired', next }))
	if (await sessionOf(call)) return seeOther(next)
	return html(HTTP_OK, signInPage({ kind: 'form', next }))
}

const TOO_MANY_LINKS: Failure = {
	status: HTTP_TOO_MANY_REQUESTS,
	code: 'TOO_MANY_LINKS',
	error: 'Too many sign-in links asked for; try again in an hour.',
}

type LinkAsk = { email: string; next: string; isJson: boolean }

async function requestLink(call: Call): Promise<Response> {
	const posted = await readPosted(call.request)
	if ('refusal' in posted) return posted.refusal
	const ask: LinkAsk = {
		email: (posted.fields.get('email') ?? '').trim().toLowerCase(),
		next: safeNext(posted.fields.get('next')),
		isJson: posted.isJson,
	}
	if (ask.email.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(ask.email))
		return refused(ask, {
			status: HTTP_BAD_REQUEST,
			code: 'INVALID_EMAIL',
			error: 'That does not read as an email address.',
		})
	const address = clientAddress(call.request)
	const limited = await limitRefusal(call.env, 'magic-link', address)
	if (limited) return refused(ask, TOO_MANY_LINKS)
	return sendLink(call, ask, await sha256Hex(address))
}

async function sendLink(
	call: Call,
	ask: LinkAsk,
	clientDigest: string,
): Promise<Response> {
	const { env, now } = call
	const counts = await linkCounts(
		env.DB,
		{ email: ask.email, clientDigest },
		now,
	)
	if (
		counts.perAddress >= LINKS_PER_ADDRESS_HOUR ||
		counts.perClient >= LINKS_PER_CLIENT_HOUR ||
		counts.today >= LINKS_PER_DAY
	)
		return refused(ask, TOO_MANY_LINKS)
	const token = randomToken()
	await insertLoginCode(
		env.DB,
		{
			digest: await sha256Hex(token),
			email: ask.email,
			next: ask.next,
			clientDigest,
			expiresAt: secondsAfter(
				now,
				MAGIC_LINK_MINUTES * SECONDS_PER_MINUTE,
			),
		},
		now,
	)
	return mailLink(env, ask, token)
}

async function mailLink(
	env: Env,
	ask: LinkAsk,
	token: string,
): Promise<Response> {
	const link = new URL(WEB_PATHS.authCallback, env.SITE_URL)
	link.searchParams.set('token', token)
	try {
		await sendSignInEmail(env, {
			to: ask.email,
			link: link.href,
			minutes: MAGIC_LINK_MINUTES,
		})
	} catch (error) {
		logFailure('magic-link-send', error)
		return refused(ask, {
			status: HTTP_BAD_GATEWAY,
			code: 'MAIL_FAILED',
			error: 'The sign-in email could not be sent; try again in a minute.',
		})
	}
	if (ask.isJson) return json(HTTP_ACCEPTED, { sent: true })
	return seeOther(`${WEB_PATHS.login}?sent=1`)
}

// A script reads the error shape; a form gets its page back, the refusal under the field.
function refused(ask: LinkAsk, failure: Failure): Response {
	if (ask.isJson) return fail(failure)
	return html(
		failure.status,
		signInPage({ kind: 'form', next: ask.next, error: failure.error }),
	)
}

async function signOut(call: Call): Promise<Response> {
	return seeOther(WEB_PATHS.login, await closeSession(call))
}

async function signOutConfirm(call: Call): Promise<Response> {
	const session = await sessionOf(call)
	if (!session) return seeOther(WEB_PATHS.login)
	return html(HTTP_OK, signOutPage(session.email))
}
