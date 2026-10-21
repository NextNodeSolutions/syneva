// The device page's answer (POST /device). Approving needs the proof the page's Approve carries
// (approval-proof.ts): only once the person has seen the account and the hub does a code pair
// anything. It draws the hub's web id (16 hex) and its token (32 random bytes), writes the hub's
// row with the token's sha256 and parks the token for the CLI's next ask, all in one transaction;
// denying marks the code, and the CLI stops with DEVICE_DENIED.
import { WEB_PATHS } from '@syneva/contracts/web'

import {
	approveDeviceCode,
	deviceCode,
	denyDeviceCode,
} from '../db/device-codes.js'
import { liveHubCount } from '../db/hubs.js'
import { fail, json, SIGNED_OUT, toSignIn } from '../http/answer.js'
import {
	HTTP_BAD_REQUEST,
	HTTP_CONFLICT,
	HTTP_FORBIDDEN,
	HTTP_GONE,
	HTTP_NOT_FOUND,
	HTTP_OK,
} from '../http/status.js'

import { isApprovalProof } from './approval-proof.js'
import {
	closedReason,
	CODE_SHAPE,
	confirmState,
	devicePageOf,
	UNKNOWN_CODE,
} from './device-view.js'
import { readPosted } from './form.js'
import { limitRefusal } from './limits.js'
import {
	normalizedUserCode,
	randomHex,
	randomToken,
	sha256Hex,
} from './secrets.js'

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

const INVALID_ASK: Failure = {
	status: HTTP_BAD_REQUEST,
	code: 'INVALID_REQUEST',
	error: 'Post { userCode, approve, confirm }.',
}

const UNCONFIRMED: Failure = {
	status: HTTP_FORBIDDEN,
	code: 'DEVICE_UNCONFIRMED',
	error: 'A hub is approved from its device page, which names the account it pairs to.',
	fix: 'Open /device?code=<the code> signed in, and press Approve there.',
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

// How a POST is answered: a script reads the JSON (DeviceApprovalAnswer, or the error shape), a
// form gets the page.
type Reply = {
	refused(failure: Failure, state: DeviceState): Promise<Response>
	answered(
		answer: DeviceApprovalAnswer,
		state: DeviceState,
	): Promise<Response>
}

type Answering = { session: Session; code: DeviceCode; reply: Reply }

function replyOf(isJson: boolean, session: Session): Reply {
	return {
		refused: async (failure, state) =>
			isJson
				? fail(failure)
				: devicePageOf(state, session, failure.status),
		answered: async (answer, state) =>
			isJson ? json(HTTP_OK, answer) : devicePageOf(state, session),
	}
}

export async function answerCode(
	call: Call,
	session: Session | null,
): Promise<Response> {
	const { request, env } = call
	const posted = await readPosted(request)
	if ('refusal' in posted) return posted.refusal
	if (!session)
		return posted.isJson ? fail(SIGNED_OUT) : toSignIn(WEB_PATHS.device)
	const limited = await limitRefusal(env, 'device', session.userId)
	if (limited) return limited
	const reply = replyOf(posted.isJson, session)
	const { fields } = posted
	const approve = fields.get('approve')
	const userCode = normalizedUserCode(fields.get('userCode') ?? '')
	if (!userCode || (approve !== '1' && approve !== '0'))
		return reply.refused(INVALID_ASK, { kind: 'enter', error: CODE_SHAPE })
	const code = await openCode(call, userCode, reply)
	if (code instanceof Response) return code
	const answering = { session, code, reply }
	if (approve === '0') return deny(call, answering)
	const proof = fields.get('confirm') ?? ''
	if (!(await isApprovalProof(env, { session, userCode }, proof)))
		return reply.refused(
			UNCONFIRMED,
			await confirmState(env, answering, UNCONFIRMED.error),
		)
	return approveCode(call, answering)
}

// The code asked about, while it still pairs something; else the refusal.
async function openCode(
	{ env, now }: Call,
	userCode: string,
	reply: Reply,
): Promise<DeviceCode | Response> {
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
	if (!closed) return code
	return reply.refused(
		{ status: HTTP_GONE, code: 'DEVICE_CLOSED', error: closed },
		{ kind: 'closed', reason: closed },
	)
}

async function deny(call: Call, { code, reply }: Answering): Promise<Response> {
	const isDenied = await denyDeviceCode(call.env.DB, code.userCode, call.now)
	if (!isDenied) return reply.refused(CLOSED_NOW, closedState(CLOSED_NOW))
	return reply.answered({ approved: false }, { kind: 'denied' })
}

async function approveCode(
	{ env, now }: Call,
	{ session, code, reply }: Answering,
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
