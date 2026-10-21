// POST /bridge/v1/device/token: the CLI's ask, every `interval` seconds until the person answers
// (login.ts's one polling loop, which a device-code flow cannot avoid). `pending` until approved;
// the hub's id and token once, then the code is spent; a refusal the CLI stops on otherwise
// (DEVICE_DENIED, DEVICE_EXPIRED, DEVICE_UNKNOWN). An ask faster than the interval is SLOW_DOWN;
// these asks never count against RL_AUTH, the interval bounds them, and so does `attempts`. The
// token is drawn here, in the answer that hands it over, and only its sha256 is written (the
// hub's row, created with it): no token is ever at rest in D1.
import { countPoll, devicePoll, takeApprovedCode } from '../db/device-codes.js'
import { fail, json } from '../http/answer.js'
import { iso } from '../http/call.js'
import {
	HTTP_BAD_REQUEST,
	HTTP_FORBIDDEN,
	HTTP_OK,
	HTTP_TOO_MANY_REQUESTS,
} from '../http/status.js'

import { readPosted } from './form.js'
import { randomToken, sha256Hex } from './secrets.js'

import type {
	DeviceTokenAnswer,
	DeviceTokenRefusal,
} from '@syneva/contracts/pairing'
import type { DevicePoll } from '../db/device-codes.js'
import type { Call } from '../http/call.js'

// RFC 4.2's interval and lifetime, as device-code answers say them.
const INTERVAL_MS = 5000
// A second's slack for the clocks on both ends: the CLI waits the interval after an answer, so
// its asks arrive further apart than that, never closer.
const SLACK_MS = 1000
// Ten minutes of asks at the interval, and some.
const MAX_ASKS = 150
const MS_PER_SECOND = 1000

type Refusal = DeviceTokenRefusal & { status: number }

const UNKNOWN: Refusal = {
	status: HTTP_BAD_REQUEST,
	code: 'DEVICE_UNKNOWN',
	error: 'This device code is unknown.',
}
const EXPIRED: Refusal = {
	status: HTTP_BAD_REQUEST,
	code: 'DEVICE_EXPIRED',
	error: 'This device code expired or was already used; run `syneva login` again.',
}
const DENIED: Refusal = {
	status: HTTP_FORBIDDEN,
	code: 'DEVICE_DENIED',
	error: 'The person denied this pairing.',
}

export async function deviceToken(call: Call): Promise<Response> {
	const { env, now, request } = call
	const posted = await readPosted(request)
	if ('refusal' in posted) return posted.refusal
	const deviceCode = posted.fields.get('deviceCode') ?? ''
	if (!deviceCode) return fail(UNKNOWN)
	const digest = await sha256Hex(deviceCode)
	const poll = await devicePoll(env.DB, digest)
	if (!poll) return fail(UNKNOWN)
	const refusal = refusalOf(poll, now)
	if (refusal) return fail(refusal)
	if (isTooSoon(poll, now)) {
		await countPoll(env.DB, digest, now)
		return fail({
			status: HTTP_TOO_MANY_REQUESTS,
			code: 'SLOW_DOWN',
			error: `Ask at most every ${INTERVAL_MS / MS_PER_SECOND} seconds.`,
		})
	}
	if (!poll.approvedAt || !poll.hubId) {
		await countPoll(env.DB, digest, now)
		return answer({ pending: true })
	}
	const token = randomToken()
	const isTaken = await takeApprovedCode(
		env.DB,
		{ digest, tokenDigest: await sha256Hex(token) },
		now,
	)
	if (!isTaken) return fail(EXPIRED)
	return answer({ hubId: poll.hubId, token })
}

function refusalOf(poll: DevicePoll, now: Date): Refusal | null {
	if (poll.deniedAt) return DENIED
	if (poll.expiresAt <= iso(now) || poll.attempts >= MAX_ASKS) return EXPIRED
	if (poll.takenAt) return EXPIRED
	return null
}

function isTooSoon(poll: DevicePoll, now: Date): boolean {
	if (!poll.lastPolledAt) return false
	const since = now.getTime() - new Date(poll.lastPolledAt).getTime()
	return since < INTERVAL_MS - SLACK_MS
}

function answer(body: DeviceTokenAnswer): Response {
	return json(HTTP_OK, body)
}
