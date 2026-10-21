// Everything a session opens (RFC 4.7): who is signed in and their settings. One D1 read checks the
// session before anything else is read (R9); a mutation must also be same-origin. Pages are not
// here (routes/shells.ts): a signed-out navigation is sent to sign in, an API call gets 401.
import { WEB_PATHS } from '@syneva/contracts/web'

import { sessionOf } from '../auth/session.js'
import { fail, json, SIGNED_OUT } from '../http/answer.js'
import { isRead } from '../http/call.js'
import { sameOriginRefusal } from '../http/guard.js'
import { HTTP_OK } from '../http/status.js'

import { settingsRoute } from './settings.js'

import type { WebMe } from '@syneva/contracts/web'
import type { Session } from '../auth/session.js'
import type { Call } from '../http/call.js'

const API_PREFIX = '/api/'

export async function sessionRoute(call: Call): Promise<Response | null> {
	if (!call.url.pathname.startsWith(API_PREFIX)) return null
	const refused = sameOriginRefusal(call)
	if (refused) return refused
	const session = await sessionOf(call)
	if (!session) return fail(SIGNED_OUT)
	return (await webApi(call, session)) ?? settingsRoute(call, session)
}

async function webApi(call: Call, session: Session): Promise<Response | null> {
	const { request, url } = call
	const { pathname } = url
	if (pathname === WEB_PATHS.me && isRead(request)) {
		const me: WebMe = { userId: session.userId, email: session.email }
		return json(HTTP_OK, me)
	}
	return null
}
