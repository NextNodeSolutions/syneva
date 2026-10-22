import http from 'node:http'
// The fake bridge's sockets (RFC 0001, 4.3 and 4.4): a hub's, opened with its token as a Bearer,
// and a tab's. Every frame a hub sends is recorded with its size and arrival time; its stream
// frames are checked for the socket's hub id and forwarded verbatim to the tabs, its relay frames
// handed to the relay. A per-socket token bucket closes a hub that sends past framesPerSecond or
// bytesPerSecond with `rate`, as the object does. Pings are answered as the object's
// auto-response answers them, outside the bucket, unless a test silenced the hub.
import { createRequire } from 'node:module'

import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	PING_TEXT,
	PONG_TEXT,
	TOO_MANY_STATUS,
} from '../../packages/contracts/dist/bridge.js'

import { bearerOf, HTTP_SWITCHING, HTTP_UNAUTHORIZED } from './http-wire.mjs'

const requireFromLocal = createRequire(
	new URL('../../packages/local/package.json', import.meta.url),
)
const { WebSocketServer } = requireFromLocal('ws')

const RELAY_KINDS = new Set(['res', 'chunk', 'err'])
const MS_PER_S = 1000

export class FakeSockets {
	hubs = new Map()
	// Every frame from every hub, every attempt to open a hub socket, every socket closed for a
	// frame the object would refuse.
	frames = []
	upgrades = []
	violations = []
	#tabs = new Set()
	#server = new WebSocketServer({
		noServer: true,
		maxPayload: BRIDGE_LIMITS.frameBytes,
	})
	#pairing
	// A status every hub upgrade is refused with (a test control); 0 for none.
	#refusal = { status: 0 }
	#relay = { frame: () => undefined, lost: () => undefined }

	constructor(pairing) {
		this.#pairing = pairing
	}

	// The relay hears its frames and the hubs it loses.
	attachRelay(relay) {
		this.#relay = relay
	}

	refuseWith(status) {
		this.#refusal = { status }
	}

	silence(hubId, silent) {
		const hub = this.hubs.get(hubId)
		if (hub) hub.silent = silent
	}

	upgradeHub(request, socket, head) {
		const hub = this.#pairing.hubOf(bearerOf(request))
		const status = this.#refusal.status || this.#refusalOf(hub)
		this.upgrades.push({
			at: Date.now(),
			status: status === 0 ? HTTP_SWITCHING : status,
			hubId: hub?.hubId ?? null,
		})
		if (status) return refuse(socket, status)
		return this.#server.handleUpgrade(request, socket, head, ws => {
			this.#acceptHub(ws, hub)
		})
	}

	upgradeTab(request, socket, head) {
		this.#server.handleUpgrade(request, socket, head, ws => {
			this.#acceptTab(ws)
		})
	}

	send(hubId, frame) {
		this.hubs.get(hubId)?.socket.send(JSON.stringify(frame))
	}

	close(hubId, code, reason = '') {
		this.hubs.get(hubId)?.socket.close(code, reason)
	}

	// An unknown token, or past `hubsPerUser` connected (the hub's own socket aside, which a new
	// one replaces): the object accepts no socket then, it answers TOO_MANY_STATUS.
	#refusalOf(hub) {
		if (!hub) return HTTP_UNAUTHORIZED
		const others = [...this.hubs.keys()].filter(id => id !== hub.hubId)
		return others.length >= BRIDGE_LIMITS.hubsPerUser ? TOO_MANY_STATUS : 0
	}

	#acceptHub(socket, { hubId, name }) {
		const hub = { hubId, name, socket, pings: [], silent: false }
		hub.bucket = new Bucket(Date.now())
		this.hubs.get(hubId)?.socket.terminate()
		this.hubs.set(hubId, hub)
		this.#broadcast({ t: 'hub', hubId, name, online: true })
		socket.on('message', raw => {
			this.#received(hub, raw)
		})
		socket.once('close', (code, reason) => {
			hub.closed = {
				code,
				reason: reason.toString('utf8'),
				at: Date.now(),
			}
			if (this.hubs.get(hubId) !== hub) return
			this.hubs.delete(hubId)
			this.#relay.lost(hubId)
			this.#broadcast({ t: 'hub', hubId, name, online: false })
		})
	}

	#received(hub, raw) {
		const at = Date.now()
		const text = raw.toString('utf8')
		if (text === PING_TEXT) {
			hub.pings.push(at)
			if (!hub.silent) hub.socket.send(PONG_TEXT)
			return
		}
		const frame = frameOf(text)
		this.frames.push({
			hubId: hub.hubId,
			text,
			frame,
			bytes: raw.length,
			at,
		})
		if (!hub.bucket.spend(raw.length, at))
			this.#violated(hub, 'rate exceeded')
		else if (RELAY_KINDS.has(frame?.t)) this.#relay.frame(hub.hubId, frame)
		else if (!frame || hubIdOf(frame) !== hub.hubId)
			this.#violated(hub, 'a frame of another hub')
		else this.#broadcast(frame, text)
	}

	#violated(hub, reason) {
		this.violations.push({ hubId: hub.hubId, reason, at: Date.now() })
		hub.socket.close(CLOSE_CODES.rate, reason)
	}

	#acceptTab(socket) {
		this.#tabs.add(socket)
		socket.once('close', () => this.#tabs.delete(socket))
		socket.on('message', raw => {
			if (raw.toString('utf8') === PING_TEXT) socket.send(PONG_TEXT)
		})
		for (const { hubId, name } of this.hubs.values()) {
			socket.send(JSON.stringify({ t: 'hub', hubId, name, online: true }))
			this.send(hubId, { t: 'snapshot?' })
		}
	}

	#broadcast(frame, text = JSON.stringify(frame)) {
		for (const tab of this.#tabs) tab.send(text)
	}
}

function refuse(socket, status) {
	socket.end(
		`HTTP/1.1 ${status} ${http.STATUS_CODES[status]}\r\nconnection: close\r\ncontent-length: 0\r\n\r\n`,
	)
}

function hubIdOf(frame) {
	return frame.t === 'hello' ? frame.hub?.id : frame.hubId
}

function frameOf(text) {
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}

// The object's bucket: one second's worth is the burst, refilled at the sustained rate.
class Bucket {
	#frames = BRIDGE_LIMITS.framesPerSecond
	#bytes = BRIDGE_LIMITS.bytesPerSecond
	#at

	constructor(now) {
		this.#at = now
	}

	spend(bytes, now) {
		const elapsed = (now - this.#at) / MS_PER_S
		this.#at = now
		this.#frames = refilled(
			this.#frames,
			elapsed,
			BRIDGE_LIMITS.framesPerSecond,
		)
		this.#bytes = refilled(
			this.#bytes,
			elapsed,
			BRIDGE_LIMITS.bytesPerSecond,
		)
		this.#frames -= 1
		this.#bytes -= bytes
		return this.#frames >= 0 && this.#bytes >= 0
	}
}

function refilled(held, elapsedS, perSecond) {
	return Math.min(perSecond, held + elapsedS * perSecond)
}
