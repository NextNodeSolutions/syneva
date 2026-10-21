// The CLI's side of pairing (RFC 4.2, contracts/pairing.ts): a device code asked for, the token
// asked for until the person approves, and the token's revocation at `syneva logout`. Nothing here
// reads a session: the device code, then the hub's token, is the CLI's credential.
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'
import { WEB_PATHS } from '@syneva/contracts/web'

import { insertDeviceCode } from '../db/device-codes.js'
import { revokeHubByToken } from '../db/hubs.js'
import { fail, json } from '../http/answer.js'
import { bearerOf } from '../http/bearer.js'
import { secondsAfter } from '../http/call.js'
import { logFailure } from '../http/log.js'
import { HTTP_OK, HTTP_UNAUTHORIZED } from '../http/status.js'
import { tellRevoked } from '../user-hub-stub.js'

import { deviceToken } from './device-token.js'
import { readPosted } from './form.js'
import { clientAddress, limitRefusal } from './limits.js'
import {
	normalizedUserCode,
	randomToken,
	sha256Hex,
	userCode,
} from './secrets.js'

import type { DeviceCodeAnswer } from '@syneva/contracts/pairing'
import type { Call } from '../http/call.js'

// RFC 4.2: the CLI asks every 5 seconds, for at most 10 minutes.
export const DEVICE_INTERVAL_S = 5
export const DEVICE_EXPIRES_S = 600
// A hub's name is its machine's hostname (a DNS label is at most 63 characters); it travels to
// the object in a header with every tab's upgrade (bridge/internal.ts), so it stays short.
const MAX_NAME_LENGTH = 64
const MAX_VERSION_LENGTH = 64

export async function pairingRoute(call: Call): Promise<Response | null> {
	const { request, url } = call
	if (request.method === 'POST' && url.pathname === BRIDGE_PATHS.deviceCode)
		return newDeviceCode(call)
	if (request.method === 'POST' && url.pathname === BRIDGE_PATHS.deviceToken)
		return deviceToken(call)
	if (request.method === 'DELETE' && url.pathname === BRIDGE_PATHS.hubRevoke)
		return revokeByToken(call)
	return null
}

async function newDeviceCode(call: Call): Promise<Response> {
	const { env, now, request } = call
	const limited = await limitRefusal(env, 'pairing', clientAddress(request))
	if (limited) return limited
	const posted = await readPosted(request)
	if ('refusal' in posted) return posted.refusal
	const hubName = (posted.fields.get('name') ?? '').slice(0, MAX_NAME_LENGTH)
	const hubVersion = (posted.fields.get('version') ?? '').slice(
		0,
		MAX_VERSION_LENGTH,
	)
	const deviceCode = randomToken()
	const shown = await insertedUserCode(
		env.DB,
		{
			digest: await sha256Hex(deviceCode),
			hubName: hubName || 'unnamed hub',
			hubVersion: hubVersion || 'unknown',
		},
		now,
	)
	const verification = new URL(WEB_PATHS.device, env.SITE_URL)
	verification.searchParams.set('code', shown)
	const answer: DeviceCodeAnswer = {
		deviceCode,
		userCode: shown,
		verificationUrl: verification.href,
		interval: DEVICE_INTERVAL_S,
		expiresIn: DEVICE_EXPIRES_S,
	}
	return json(HTTP_OK, answer)
}

// A user code nobody else's live code holds: drawn again on the rare collision.
async function insertedUserCode(
	db: D1Database,
	code: { digest: string; hubName: string; hubVersion: string },
	now: Date,
): Promise<string> {
	const shown = userCode()
	const isInserted = await insertDeviceCode(
		db,
		{
			...code,
			userCode: normalizedUserCode(shown) ?? shown,
			expiresAt: secondsAfter(now, DEVICE_EXPIRES_S),
		},
		now,
	)
	if (isInserted) return shown
	return insertedUserCode(db, code, now)
}

async function revokeByToken(call: Call): Promise<Response> {
	const { env, now, request } = call
	const token = bearerOf(request)
	const hub = token
		? await revokeHubByToken(env.DB, await sha256Hex(token), now)
		: null
	if (!hub)
		return fail({
			status: HTTP_UNAUTHORIZED,
			code: 'UNAUTHORIZED',
			error: 'This token opens no hub.',
		})
	// The row says revoked whatever the object answers: the next upgrade is refused, and the CLI
	// tells its running hub to drop the socket too.
	await tellRevoked(env, { userId: hub.userId, hubId: hub.id }).catch(
		(error: unknown) => {
			logFailure('revoke-object', error)
		},
	)
	return json(HTTP_OK, { ok: true })
}
