// The fake bridge's HTTP relay (RFC 0001, 4.5): a request under /api/ goes to the hub its web id
// names (or the `x-syneva-hub` header, where the web reads the body's `hubId` or the tab's pick)
// as one `req`, and its `res` and `chunk` frames stream back as they come. As the object: no hub
// socket answers 503 HUB_OFFLINE at once, past inFlightPerUser 429, the deadline 504 HUB_TIMEOUT
// with a `cancel`, a socket closed mid-flight 502, a client gone first a `cancel`. `raw` sends a
// `req` of the test's own (a path the web would never relay, a 33rd in flight) and collects the
// frames that answer it.
import { randomUUID } from 'node:crypto'

import {
	BRIDGE_LIMITS,
	splitWebDeskId,
} from '../../packages/contracts/dist/bridge.js'
import {
	DESK_API_PREFIX,
	HUB_PATHS,
} from '../../packages/contracts/dist/routes.js'

import {
	failJson,
	HTTP_BAD_GATEWAY,
	HTTP_GATEWAY_TIMEOUT,
	HTTP_TOO_LARGE,
	HTTP_TOO_MANY,
	HTTP_UNAVAILABLE,
	readBytes,
} from './http-wire.mjs'

const HUB_HEADER = 'x-syneva-hub'
const FAILURE_STATUS = new Map([
	['TOO_LARGE', HTTP_TOO_LARGE],
	['TOO_MANY', HTTP_TOO_MANY],
])
const ID_PREFIXES = [
	DESK_API_PREFIX,
	`${HUB_PATHS.desks}/`,
	`${HUB_PATHS.plans}/`,
]

export class FakeRelay {
	#pending = new Map()
	#sockets

	constructor(sockets) {
		this.#sockets = sockets
		sockets.attachRelay({
			frame: (hubId, frame) => {
				const relay = this.#pending.get(frame.id)
				if (relay?.hubId === hubId) relay.frame(frame)
			},
			lost: hubId => {
				for (const relay of this.#pending.values())
					if (relay.hubId === hubId) relay.lost()
			},
		})
	}

	inFlight() {
		return this.#pending.size
	}

	// Sends `req` (`request` without its `t`) and settles with every frame answering it once the
	// answer is whole or failed, the socket closed, `waitMs` passed, or the test cancelled it (as
	// the web does, it then forgets the relay: frames that still come are only recorded).
	raw(hubId, request, waitMs = BRIDGE_LIMITS.deadlineMs) {
		const id = request.id ?? randomUUID()
		const frames = []
		const { promise, resolve } = Promise.withResolvers()
		const finish = () => {
			clearTimeout(timer)
			this.#pending.delete(id)
			resolve(frames)
		}
		const timer = setTimeout(finish, waitMs)
		const frame = each => {
			frames.push(each)
			if (isLast(each)) finish()
		}
		this.#pending.set(id, { hubId, frame, lost: finish })
		this.#sockets.send(hubId, { ...request, t: 'req', id })
		return {
			id,
			frames,
			done: promise,
			cancel: () => {
				this.#sockets.send(hubId, { t: 'cancel', id })
				finish()
			},
		}
	}

	async http(request, response, url) {
		const hubId = hubOf(url, request.headers)
		if (!this.#sockets.hubs.has(hubId))
			return failJson(response, HTTP_UNAVAILABLE, 'HUB_OFFLINE')
		if (this.#pending.size >= BRIDGE_LIMITS.inFlightPerUser)
			return failJson(response, HTTP_TOO_MANY, 'TOO_MANY')
		const body = await readBytes(request, BRIDGE_LIMITS.requestBodyBytes)
		if (!body) return failJson(response, HTTP_TOO_LARGE, 'TOO_LARGE')
		return this.#forward(hubId, { request, response, url, body })
	}

	#forward(hubId, { request, response, url, body }) {
		const id = randomUUID()
		const cancel = () => this.#sockets.send(hubId, { t: 'cancel', id })
		let isDone = false
		const finish = () => {
			isDone = true
			clearTimeout(deadline)
			this.#pending.delete(id)
		}
		const deadline = setTimeout(() => {
			cancel()
			finish()
			cut(response, HTTP_GATEWAY_TIMEOUT, 'HUB_TIMEOUT')
		}, BRIDGE_LIMITS.deadlineMs)
		response.once('close', () => {
			if (isDone) return
			cancel()
			finish()
		})
		this.#pending.set(id, {
			hubId,
			frame(frame) {
				if (isLast(frame)) finish()
				answer(response, frame)
			},
			lost() {
				finish()
				cut(response, HTTP_BAD_GATEWAY, 'HUB_OFFLINE')
			},
		})
		this.#sockets.send(hubId, {
			t: 'req',
			id,
			method: request.method,
			path: url.pathname,
			query: url.search,
			...bodyOf(body),
		})
	}
}

// A request's body as a `req` carries it: its text, or no key at all.
function bodyOf(bytes) {
	if (!bytes.length) return undefined
	return { body: bytes.toString('utf8') }
}

// An answer that cannot finish: its failure if nothing was written yet, else a cut connection.
function cut(response, status, code) {
	if (response.headersSent) response.destroy()
	else failJson(response, status, code)
}

function answer(response, frame) {
	if (frame.t === 'err') {
		const status = FAILURE_STATUS.get(frame.code) ?? HTTP_BAD_GATEWAY
		failJson(response, status, frame.code)
		return
	}
	if (frame.t === 'res') response.writeHead(frame.status, frame.headers)
	const encoded = frame.t === 'res' ? frame.body : frame.data
	if (encoded) response.write(Buffer.from(encoded, 'base64'))
	if (!frame.more) response.end()
}

function isLast(frame) {
	return frame.t === 'err' || !frame.more
}

// The hub a relayed path names by its web id's prefix, else the one the header names.
function hubOf(url, headers) {
	const prefix = ID_PREFIXES.find(each => url.pathname.startsWith(each))
	const id = prefix ? url.pathname.slice(prefix.length).split('/')[0] : ''
	return splitWebDeskId(id)?.hubId ?? headers[HUB_HEADER] ?? ''
}
