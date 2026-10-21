// The fake bridge's pairing (RFC 0001, 4.2): device codes, their approval (a test-only control
// where the web has a signed-in page), the hubs' tokens and their revocation. One user; nothing
// outlives the process.
import { randomBytes } from 'node:crypto'

import {
	bearerOf,
	failJson,
	HTTP_BAD_REQUEST,
	HTTP_FORBIDDEN,
	HTTP_NOT_FOUND,
	HTTP_OK,
	HTTP_UNAUTHORIZED,
	readJson,
	sendJson,
} from './http-wire.mjs'

const HUB_ID_BYTES = 8
const TOKEN_BYTES = 32
const DEVICE_CODE_BYTES = 16
const USER_CODE_BYTES = 4
const EXPIRES_IN_S = 600
const BODY_CAP = 65_536

export class FakePairing {
	revocations = []
	#devices = new Map()
	#tokens = new Map()
	#origin
	#interval

	constructor({ origin, interval }) {
		this.#origin = origin
		this.#interval = interval
	}

	// The hub a token opens; undefined when it is unknown or revoked.
	hubOf(token) {
		const hub = this.#tokens.get(token)
		if (hub?.revoked) return undefined
		return hub
	}

	async deviceCode(request, response) {
		const { name = '', version = '' } = await readJson(request, BODY_CAP)
		const deviceCode = randomBytes(DEVICE_CODE_BYTES).toString('hex')
		const userCode = randomBytes(USER_CODE_BYTES)
			.toString('hex')
			.toUpperCase()
		this.#devices.set(deviceCode, { userCode, name, version, hub: null })
		sendJson(response, HTTP_OK, {
			deviceCode,
			userCode,
			verificationUrl: `${this.#origin()}/pair?code=${userCode}`,
			interval: this.#interval,
			expiresIn: EXPIRES_IN_S,
		})
	}

	async deviceToken(request, response) {
		const { deviceCode = '' } = await readJson(request, BODY_CAP)
		const device = this.#devices.get(deviceCode)
		if (!device)
			return failJson(response, HTTP_BAD_REQUEST, 'DEVICE_UNKNOWN')
		if (device.isDenied)
			return failJson(response, HTTP_FORBIDDEN, 'DEVICE_DENIED')
		if (!device.hub) return sendJson(response, HTTP_OK, { pending: true })
		this.#devices.delete(deviceCode)
		const { hubId, token } = device.hub
		return sendJson(response, HTTP_OK, { hubId, token })
	}

	// Test-only: what the person does on the web's verification page.
	async approve(request, response) {
		const { userCode = '', deny = false } = await readJson(
			request,
			BODY_CAP,
		)
		const device = [...this.#devices.values()].find(
			each => each.userCode === userCode,
		)
		if (!device) return failJson(response, HTTP_NOT_FOUND, 'DEVICE_UNKNOWN')
		if (deny) {
			device.isDenied = true
			return sendJson(response, HTTP_OK, { denied: true })
		}
		const hubId = randomBytes(HUB_ID_BYTES).toString('hex')
		const token = randomBytes(TOKEN_BYTES).toString('base64url')
		device.hub = { hubId, token, name: device.name, revoked: false }
		this.#tokens.set(token, device.hub)
		return sendJson(response, HTTP_OK, { hubId })
	}

	// DELETE /bridge/v1/hub: the token's hub is forgotten and `closeHub` closes its socket.
	revoke(request, response, closeHub) {
		const hub = this.hubOf(bearerOf(request))
		if (!hub) return failJson(response, HTTP_UNAUTHORIZED, 'UNAUTHORIZED')
		hub.revoked = true
		this.revocations.push({ at: Date.now(), hubId: hub.hubId })
		closeHub(hub.hubId)
		return sendJson(response, HTTP_OK, { ok: true })
	}
}
