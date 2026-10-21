// A tab's socket as the cost tests drive it: opened with the person's cookie and the page's origin
// (the guard an upgrade passes), every frame recorded with its arrival, pings on request, and the
// misbehaviours a tab must be closed for (any frame but a ping).
import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	PING_TEXT,
	PONG_TEXT,
} from '../../../../packages/contracts/dist/bridge.js'

import { wsUrl } from './fake-hub.mjs'
import { OPEN, watchClose, WebSocket } from './ws.mjs'

export class FakeTab {
	frames = []
	wakers = new Set()
	pings = 0
	pongs = 0
	/** @type {{ code: number, reason?: string, status?: number, at: number } | null} */
	closeInfo = null
	closed = Promise.resolve(null)
	/** @type {any} */
	#socket = null
	/** @type {any} */
	#pingTimer = null

	// `headers` are the browser's: its origin and its session cookie.
	constructor({ origin, headers }) {
		this.origin = origin
		this.headers = headers
	}

	get isOpen() {
		return this.#socket?.readyState === OPEN
	}

	get socket() {
		return this.#socket
	}

	// Resolves with 'open', or the HTTP status that refused the upgrade.
	connect({ pingMs = 0 } = {}) {
		this.closeInfo = null
		this.frames = []
		this.pings = 0
		this.pongs = 0
		const socket = new WebSocket(
			wsUrl(this.origin, BRIDGE_PATHS.tabSocket),
			{ headers: this.headers },
		)
		this.#socket = socket
		this.closed = new Promise(resolve => {
			watchClose(socket, ended => {
				this.closeInfo = ended
				clearInterval(this.#pingTimer)
				resolve(ended)
			})
		})
		socket.on('message', raw => {
			this.#received(raw.toString('utf8'))
		})
		return new Promise((resolve, reject) => {
			socket.once('open', () => {
				if (pingMs) this.startPings(pingMs)
				resolve('open')
			})
			socket.once('unexpected-response', (_request, response) => {
				response.resume()
				this.closeInfo = {
					code: 0,
					status: response.statusCode,
					at: Date.now(),
				}
				resolve(response.statusCode)
			})
			socket.once('error', error => {
				if (this.closeInfo) return
				reject(error)
			})
		})
	}

	async attempt(options) {
		try {
			return { outcome: await this.connect(options) }
		} catch (error) {
			return { outcome: 'failed', reason: error.message }
		}
	}

	startPings(ms = BRIDGE_LIMITS.pingIntervalMs) {
		clearInterval(this.#pingTimer)
		this.#pingTimer = setInterval(() => {
			if (this.send(PING_TEXT)) this.pings += 1
		}, ms)
	}

	send(text) {
		if (!this.isOpen) return false
		this.#socket.send(text)
		return true
	}

	sendBinary(bytes = Buffer.from([1, 2, 3])) {
		if (!this.isOpen) return false
		this.#socket.send(bytes, { binary: true })
		return true
	}

	close(code = 1000) {
		if (this.#socket?.readyState === OPEN) this.#socket.close(code)
	}

	terminate() {
		clearInterval(this.#pingTimer)
		this.#socket?.terminate()
	}

	#received(text) {
		const isPong = text === PONG_TEXT
		if (isPong) this.pongs += 1
		this.frames.push({
			text,
			frame: isPong ? { t: 'o' } : parsed(text),
			at: Date.now(),
			isPong,
		})
		for (const wake of this.wakers) wake()
	}
}

function parsed(text) {
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}
