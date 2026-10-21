// The web's pairing endpoints as the CLI calls them (RFC 0001, 4.2): a device code, the hub's
// token once the person approved it, and the token's revocation. Each call is bounded, and every
// failure says its cause: the web unreachable, an answer that does not read, or the web's own
// error.
import { BRIDGE_PATHS } from '@syneva/contracts/bridge'
import { errorMessage } from '@syneva/core/application/errors'

import type {
	DeviceCodeAnswer,
	DeviceCodeRequest,
	DeviceTokenAnswer,
} from '@syneva/contracts/pairing'

const CALL_TIMEOUT_MS = 10_000

// A call that did not give the flow what it needs; the message names the cause.
export class WebCallError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options)
		this.name = 'WebCallError'
	}
}

// The token step's answer: the token, still pending, asked too soon (429, SLOW_DOWN or the web's
// rate limit), a failure worth asking again after (the web did not answer, or failed with a 5xx)
// in words, or the web's refusal in words (the code was denied, expired, or is unknown to it).
export type TokenStep =
	| DeviceTokenAnswer
	| { slowDown: true }
	| { transient: string }
	| { refused: string }

type WebAnswer = { status: number; body: unknown }

export async function requestDeviceCode(
	web: string,
	request: DeviceCodeRequest,
): Promise<DeviceCodeAnswer> {
	const answer = await call(web, BRIDGE_PATHS.deviceCode, {
		method: 'POST',
		body: request,
	})
	if (!isOk(answer.status)) throw new WebCallError(refusalOf(web, answer))
	const code = readDeviceCode(answer.body)
	if (!code)
		throw new WebCallError(
			`${web} answered a device code that does not read.`,
		)
	return code
}

export async function requestDeviceToken(
	web: string,
	deviceCode: string,
): Promise<TokenStep> {
	const answer = await tokenCall(web, deviceCode)
	if ('transient' in answer) return answer
	if (answer.status === HTTP_TOO_MANY) return { slowDown: true }
	if (isTransient(answer.status)) return { transient: refusalOf(web, answer) }
	if (!isOk(answer.status)) return { refused: refusalOf(web, answer) }
	const token = readDeviceToken(answer.body)
	if (!token)
		throw new WebCallError(`${web} answered a token that does not read.`)
	return token
}

// The web forgets the token and closes the hub's socket with `revoked`.
export async function revokeHub(web: string, token: string): Promise<void> {
	const answer = await call(web, BRIDGE_PATHS.hubRevoke, {
		method: 'DELETE',
		token,
	})
	if (!isOk(answer.status)) throw new WebCallError(refusalOf(web, answer))
}

// The token call; the web unreachable or silent is a step worth asking again after.
async function tokenCall(
	web: string,
	deviceCode: string,
): Promise<WebAnswer | { transient: string }> {
	try {
		return await call(web, BRIDGE_PATHS.deviceToken, {
			method: 'POST',
			body: { deviceCode },
		})
	} catch (error) {
		if (!(error instanceof WebCallError)) throw error
		return { transient: error.message }
	}
}

async function call(
	web: string,
	path: string,
	init: { method: 'POST' | 'DELETE'; body?: object; token?: string },
): Promise<WebAnswer> {
	const headers: Record<string, string> = {}
	if (init.body) headers['content-type'] = 'application/json'
	if (init.token) headers.authorization = `Bearer ${init.token}`
	try {
		const response = await fetch(new URL(path, web), {
			method: init.method,
			headers,
			...jsonBody(init.body),
			signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
		})
		return { status: response.status, body: await jsonOf(response) }
	} catch (error) {
		throw new WebCallError(`${web} did not answer (${causeOf(error)}).`, {
			cause: error,
		})
	}
}

// RequestInit.body admits no undefined under exactOptionalPropertyTypes: a bodiless call (the
// revocation) gets no key at all.
function jsonBody(payload: object | undefined): { body: string } | undefined {
	if (!payload) return undefined
	return { body: JSON.stringify(payload) }
}

function isOk(status: number): boolean {
	return status >= HTTP_OK && status < HTTP_REDIRECT
}

// The web (or what stands before it) failed this time: a timeout or a server error.
function isTransient(status: number): boolean {
	return status === HTTP_TIMEOUT || status >= HTTP_SERVER_ERROR
}

const HTTP_OK = 200
const HTTP_REDIRECT = 300
const HTTP_TIMEOUT = 408
const HTTP_TOO_MANY = 429
const HTTP_SERVER_ERROR = 500

async function jsonOf(response: Response): Promise<unknown> {
	const text = await response.text()
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}

// fetch hides the network's own error (ECONNREFUSED, ENOTFOUND) behind "fetch failed".
function causeOf(error: unknown): string {
	if (error instanceof Error && error.cause instanceof Error)
		return errorMessage(error.cause)
	return errorMessage(error)
}

// The web's error in its own words (`{ error, code }`), else its status.
function refusalOf(web: string, answer: WebAnswer): string {
	const fields = fieldsOf(answer.body)
	const error = typeof fields?.error === 'string' ? fields.error : null
	const code = typeof fields?.code === 'string' ? ` ${fields.code}` : ''
	if (error) return `${web} answered ${answer.status}${code}: ${error}`
	return `${web} answered ${answer.status}${code}.`
}

function fieldsOf(raw: unknown): Record<string, unknown> | null {
	if (typeof raw !== 'object' || raw === null) return null
	return Object.fromEntries(Object.entries(raw))
}

function readDeviceCode(raw: unknown): DeviceCodeAnswer | null {
	const fields = fieldsOf(raw)
	if (!fields) return null
	const { deviceCode, userCode, verificationUrl } = fields
	const interval = secondsOf(fields.interval)
	const expiresIn = secondsOf(fields.expiresIn)
	if (
		typeof deviceCode !== 'string' ||
		typeof userCode !== 'string' ||
		typeof verificationUrl !== 'string' ||
		!interval ||
		!expiresIn
	)
		return null
	return { deviceCode, userCode, verificationUrl, interval, expiresIn }
}

function readDeviceToken(raw: unknown): DeviceTokenAnswer | null {
	const fields = fieldsOf(raw)
	if (!fields) return null
	if (fields.pending === true) return { pending: true }
	const { hubId, token } = fields
	if (typeof hubId !== 'string' || typeof token !== 'string' || !token)
		return null
	return { hubId, token }
}

// A count of seconds the web set: positive and finite, else none.
function secondsOf(raw: unknown): number | null {
	if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0)
		return null
	return raw
}
