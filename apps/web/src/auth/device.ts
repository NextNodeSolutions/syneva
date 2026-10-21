// The person's side of pairing (RFC 4.2, step 3): the device page shows the hub a code pairs and
// takes the answer. Approving draws the hub's web id (16 hex) and its token (32 random bytes),
// writes the hub's row with the token's sha256 and parks the token for the CLI's next ask, all in
// one transaction; denying marks the code, and the CLI stops with DEVICE_DENIED. Signed in only,
// same-origin, and limited per person.
import { WEB_PATHS } from '@syneva/contracts/web'

import {
	approveDeviceCode,
	deviceCode,
	denyDeviceCode,
} from '../db/device-codes.js'
import { liveHubCount } from '../db/hubs.js'
import { fail, html, json, SIGNED_OUT, toSignIn } from '../http/answer.js'
import { iso } from '../http/call.js'
import { sameOriginRefusal } from '../http/guard.js'
import {
	HTTP_BAD_REQUEST,
	HTTP_CONFLICT,
	HTTP_GONE,
	HTTP_NOT_FOUND,
	HTTP_OK,
} from '../http/status.js'
import { devicePage } from '../pages/device.js'

import { readPosted } from './form.js'
import { limitRefusal } from './limits.js'
import {
	displayedUserCode,
	normalizedUserCode,
	randomHex,
	randomToken,
	sha256Hex,
} from './secrets.js'
import { sessionOf } from './session.js'

import type { DeviceApprovalAnswer } from '@syneva/contracts/web'
import type { DeviceCode } from '../db/device-codes.js'
import type { Failure } from '../http/answer.js'
import type { Call } from '../http/call.js'
import type { DeviceState } from '../pages/device.js'
import type { Session } from './session.js'

// A web hub id is 16 hex characters (contracts' isWebHubId).
const HUB_ID_BYTES = 8
// Live hubs per account: past this, one is revoked before another pairs. Online at once, the
// object allows `hubsPerUser`; this bounds the rows each tab's upgrade carries to the object.
const MAX_LIVE_HUBS = 32

const CODE_SHAPE = 'A code is eight letters and digits, as XXXX-XXXX.'
const INVALID_ASK: Failure = {
	status: HTTP_BAD_REQUEST,
	code: 'INVALID_REQUEST',
	error: 'Post { userCode, approve }.',
}

const CLOSED_NOW: Failure = {
	status: HTTP_GONE,
	code: 'DEVICE_CLOSED',
	error: 'This code was answered or expired a moment ago.',
}

const TOO_MANY_HUBS: Failure = {
	status: HTTP_CONFLICT,
	code: 'TOO_MANY_HUBS',
	error: `This account has ${MAX_LIVE_HUBS} paired hubs: revoke one on the Hub page before pairing another.`,
}

const UNKNOWN_CODE =
	'No hub asks with this code. Check it against your terminal, or run `syneva login` again.'

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
	const typed = url.searchParams.get('code')
	if (typed === null) return page({ kind: 'enter' })
	const userCode = normalizedUserCode(typed)
	if (!userCode) return page({ kind: 'enter', error: CODE_SHAPE })
	const code = await deviceCode(env.DB, userCode)
	if (!code) return page({ kind: 'enter', error: UNKNOWN_CODE })
	const closed = closedReason(code, now)
	if (closed) return page({ kind: 'closed', reason: closed })
	return page({
		kind: 'confirm',
		userCode: displayedUserCode(code.userCode),
		hubName: code.hubName,
		hubVersion: code.hubVersion,
	})
}

// How a POST is answered: a script reads the JSON (DeviceApprovalAnswer, or the error shape), a
// form gets the page.
type Reply = {
	refused(failure: Failure, state: DeviceState): Response
	answered(answer: DeviceApprovalAnswer, state: DeviceState): Response
}

function replyOf(isJson: boolean): Reply {
	return {
		refused: (failure, state) =>
			isJson ? fail(failure) : page(state, failure.status),
		answered: (answer, state) =>
			isJson ? json(HTTP_OK, answer) : page(state),
	}
}

async function answerCode(
	call: Call,
	session: Session | null,
): Promise<Response> {
	const { request, env, now } = call
	const posted = await readPosted(request)
	if ('refusal' in posted) return posted.refusal
	if (!session)
		return posted.isJson ? fail(SIGNED_OUT) : toSignIn(WEB_PATHS.device)
	const limited = await limitRefusal(env, 'device', session.userId)
	if (limited) return limited
	const reply = replyOf(posted.isJson)
	const approve = posted.fields.get('approve')
	const userCode = normalizedUserCode(posted.fields.get('userCode') ?? '')
	if (!userCode || (approve !== '1' && approve !== '0'))
		return reply.refused(INVALID_ASK, { kind: 'enter', error: CODE_SHAPE })
	const code = await deviceCode(env.DB, userCode)
	if (!code)
		return reply.refused(
			{
				status: HTTP_NOT_FOUND,
				code: 'DEVICE_UNKNOWN',
				error: UNKNOWN_CODE,
			},
			{ kind: 'enter', error: UNKNOWN_CODE },
		)
	const closed = closedReason(code, now)
	if (closed)
		return reply.refused(
			{ status: HTTP_GONE, code: 'DEVICE_CLOSED', error: closed },
			{ kind: 'closed', reason: closed },
		)
	if (approve === '0') return deny(call, code, reply)
	return approveCode(call, { session, code, reply })
}

async function deny(
	call: Call,
	code: DeviceCode,
	reply: Reply,
): Promise<Response> {
	const isDenied = await denyDeviceCode(call.env.DB, code.userCode, call.now)
	if (!isDenied) return reply.refused(CLOSED_NOW, closedState(CLOSED_NOW))
	return reply.answered({ approved: false }, { kind: 'denied' })
}

async function approveCode(
	{ env, now }: Call,
	{
		session,
		code,
		reply,
	}: { session: Session; code: DeviceCode; reply: Reply },
): Promise<Response> {
	const token = randomToken()
	const isApproved = await approveDeviceCode(
		env.DB,
		{
			userCode: code.userCode,
			userId: session.userId,
			hubId: randomHex(HUB_ID_BYTES),
			token,
			tokenDigest: await sha256Hex(token),
			maxLiveHubs: MAX_LIVE_HUBS,
		},
		now,
	)
	if (!isApproved) {
		const failure =
			(await liveHubCount(env.DB, session.userId)) >= MAX_LIVE_HUBS
				? TOO_MANY_HUBS
				: CLOSED_NOW
		return reply.refused(failure, closedState(failure))
	}
	return reply.answered(
		{ approved: true, hubName: code.hubName },
		{ kind: 'approved', hubName: code.hubName },
	)
}

function closedState(failure: Failure): DeviceState {
	return { kind: 'closed', reason: failure.error }
}

// Why a code no longer pairs anything; null while it is open.
function closedReason(code: DeviceCode, now: Date): string | null {
	if (code.approvedAt) return 'It was approved already: its hub is paired.'
	if (code.deniedAt)
		return 'It was denied: run `syneva login` again to pair this hub.'
	if (code.expiresAt <= iso(now))
		return 'It expired (a code lives ten minutes): run `syneva login` again.'
	return null
}

function page(state: DeviceState, status = HTTP_OK): Response {
	return html(status, devicePage(state))
}
