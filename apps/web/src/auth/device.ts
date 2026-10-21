// The person's side of pairing (RFC 4.2, step 3): the device page shows the hub a code pairs and
// the account it pairs to, and takes the answer (device-answer.ts). Signed in only, same-origin,
// and limited per person.
import { WEB_PATHS } from '@syneva/contracts/web'

import { deviceCode } from '../db/device-codes.js'
import { toSignIn } from '../http/answer.js'
import { sameOriginRefusal } from '../http/guard.js'

import { answerCode } from './device-answer.js'
import {
	closedReason,
	CODE_SHAPE,
	confirmState,
	devicePageOf,
	UNKNOWN_CODE,
} from './device-view.js'
import { normalizedUserCode } from './secrets.js'
import { sessionOf } from './session.js'

import type { Call } from '../http/call.js'
import type { DeviceState } from '../pages/device.js'
import type { Session } from './session.js'

export async function deviceRoute(call: Call): Promise<Response | null> {
	if (call.url.pathname !== WEB_PATHS.device) return null
	const { request } = call
	if (request.method !== 'GET' && request.method !== 'POST') return null
	const refused = sameOriginRefusal(call)
	if (refused) return refused
	const session = await sessionOf(call)
	if (request.method === 'GET') return showCode(call, session)
	return answerCode(call, session)
}

async function showCode(
	call: Call,
	session: Session | null,
): Promise<Response> {
	const { url, env, now } = call
	if (!session) return toSignIn(`${url.pathname}${url.search}`)
	const shown = (state: DeviceState): Promise<Response> =>
		devicePageOf(state, session)
	const typed = url.searchParams.get('code')
	if (typed === null) return shown({ kind: 'enter' })
	const userCode = normalizedUserCode(typed)
	if (!userCode) return shown({ kind: 'enter', error: CODE_SHAPE })
	const code = await deviceCode(env.DB, userCode)
	if (!code) return shown({ kind: 'enter', error: UNKNOWN_CODE })
	const closed = closedReason(code, now)
	if (closed) return shown({ kind: 'closed', reason: closed })
	return shown(await confirmState(env, { session, code }))
}
