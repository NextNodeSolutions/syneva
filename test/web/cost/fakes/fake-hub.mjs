// A paired hub as the cost tests need one, driven by hand: it opens the hub socket with its token
// (RFC 0001, 4.3), says hello and closes its snapshot, pings, answers `snapshot?` the way a sane
// probe does (the asks of a burst at once, a tagged ask with a snapshot tagged for its tab), and
// then misbehaves on request - floods, oversized or
// malformed frames, a `req` it never answers, an answer of N MiB, a socket that drops mid-answer.
// Every frame it receives is recorded, so a test reads what the object sent and when.
import { createHash, randomBytes } from 'node:crypto'

import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	PING_TEXT,
	PONG_TEXT,
} from '../../../../packages/contracts/dist/bridge.js'

import { delay } from './timing.mjs'
import { OPEN, watchClose, WebSocket } from './ws.mjs'

// Paced a little under the object's inbound budget, as the probe's send window is: a polite hub
// never trips the bucket whatever its clock drift.
const POLITE_BYTES_PER_S = Math.floor(BRIDGE_LIMITS.bytesPerSecond * 0.95)
const SNAPSHOT_DEBOUNCE_MS = 1500
const MS_PER_S = 1000
const TICK_MS = 5

export function wsUrl(origin, route) {
	const url = new URL(route, origin)
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
	return url.href
}

export class FakeHub {
	// What the object sent, in order: { text, frame, at }. `wakers` lets stream-client's waitFor
	// read it as it reads a tab.
	frames = []
	wakers = new Set()
	requests = []
	cancels = []
	cancelled = new Set()
	pings = 0
	pongs = 0
	/** @type {{ code: number, reason?: string, status?: number, at: number } | null} */
	closeInfo = null
	// Called with each `req` frame; a test sets it before the first request.
	handler = null
	closed = Promise.resolve(null)
	/** @type {any} */
	#socket = null
	/** @type {any} */
	#pingTimer = null
	/** @type {any} */
	#snapshotTimer = null
	// The asks the next answer serves: the tabs their tags name, and whether an untagged one came.
	#askedTags = new Set()
	#isAskedUntagged = false
	#nextAt = 0
	#answerSnapshots = true
	#instanceId = randomBytes(4).toString('hex')

	constructor({ hubId, token, origin, name = 'cost-hub' }) {
		this.hubId = hubId
		this.token = token
		this.origin = origin
		this.name = name
	}

	get isOpen() {
		return this.#socket?.readyState === OPEN
	}

	get socket() {
		return this.#socket
	}

	// Opens the socket; resolves with 'open', or the HTTP status that refused the upgrade.
	connect({ answerSnapshots = true, pingMs = 0, sayHello = true } = {}) {
		this.#answerSnapshots = answerSnapshots
		this.closeInfo = null
		this.frames = []
		this.requests = []
		this.cancels = []
		this.cancelled = new Set()
		this.pings = 0
		this.pongs = 0
		const socket = new WebSocket(
			wsUrl(this.origin, BRIDGE_PATHS.hubSocket),
			{
				headers: { authorization: `Bearer ${this.token}` },
			},
		)
		this.#socket = socket
		this.closed = new Promise(resolve => {
			watchClose(socket, ended => {
				this.closeInfo = ended
				this.#stopTimers()
				resolve(ended)
			})
		})
		socket.on('message', raw => {
			this.#received(raw.toString('utf8'))
		})
		return new Promise((resolve, reject) => {
			socket.once('open', () => {
				if (sayHello) this.sayHello()
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

	// Connects and settles with { outcome } even when the network refuses (the attempt's end).
	async attempt(options) {
		try {
			return { outcome: await this.connect(options) }
		} catch (error) {
			return { outcome: 'failed', reason: error.message }
		}
	}

	// A snapshot with no desk: `hello`, then `snapshot-end`, both tagged for the tab `tag` names.
	sayHello(tag) {
		const tagged = taggedFor(tag)
		this.sendJson({
			t: 'hello',
			hub: {
				id: this.hubId,
				name: this.name,
				version: 'cost-test',
				instanceId: this.#instanceId,
				startedAt: new Date().toISOString(),
			},
			...tagged,
		})
		this.sendJson({ t: 'snapshot-end', hubId: this.hubId, ...tagged })
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

	sendJson(frame) {
		return this.send(JSON.stringify(frame))
	}

	sendBinary(bytes = Buffer.from([1, 2, 3])) {
		if (!this.isOpen) return false
		this.#socket.send(bytes, { binary: true })
		return true
	}

	// A text frame held to the polite rate: waits for its turn, then goes.
	async sendPaced(text) {
		const bytes = Buffer.byteLength(text)
		const now = Date.now()
		const startAt = Math.max(now, this.#nextAt)
		this.#nextAt = startAt + (bytes / POLITE_BYTES_PER_S) * MS_PER_S
		if (startAt > now) await delay(startAt - now)
		return this.send(text)
	}

	close(code = 1000, reason = '') {
		if (this.#socket?.readyState === OPEN) this.#socket.close(code, reason)
	}

	terminate() {
		this.#stopTimers()
		this.#socket?.terminate()
	}

	// A `pulse` frame that is this hub's (the object checks only the hub id), padded to `padBytes`.
	pulse(padBytes = 0) {
		return JSON.stringify({
			t: 'pulse',
			hubId: this.hubId,
			deskId: 'cafe',
			pulse: { pad: 'x'.repeat(padBytes) },
		})
	}

	// `perSecond` frames a second for `seconds`, as evenly as timers allow, until the socket closes.
	async flood({ perSecond, seconds, build = () => this.pulse() }) {
		const startedAt = Date.now()
		let sent = 0
		while (this.isOpen && Date.now() - startedAt < seconds * MS_PER_S) {
			const due = Math.floor(
				((Date.now() - startedAt) / MS_PER_S) * perSecond,
			)
			for (; sent < due; sent += 1) if (!this.send(build(sent))) break
			await delay(TICK_MS)
		}
		return { sent, startedAt }
	}

	// One relayed answer in one frame.
	answerJson(id, body, status = 200) {
		const bytes = Buffer.from(JSON.stringify(body))
		return this.sendJson({
			t: 'res',
			id,
			status,
			headers: { 'content-type': 'application/json' },
			body: bytes.toString('base64'),
		})
	}

	// An answer of `bytes` random bytes as the probe sends it: `res { more }`, then `chunk` frames
	// of at most `chunkBytes` of base64, paced under the inbound budget. Stops when the object
	// cancels it. `dropAfterChunks` ends the socket mid-answer. Resolves with the sha256 of what
	// was sent.
	async streamAnswer(id, options) {
		const {
			bytes,
			chunkBytes = BRIDGE_LIMITS.chunkBytes,
			dropAfterChunks = 0,
		} = options
		const rawChunk = Math.floor(chunkBytes / 4) * 3
		const hash = createHash('sha256')
		const head = { 'content-type': 'application/octet-stream' }
		await this.sendPaced(
			JSON.stringify({
				t: 'res',
				id,
				status: 200,
				headers: head,
				more: true,
			}),
		)
		const sent = { bytes: 0, chunks: 0 }
		while (sent.bytes < bytes && this.isOpen && !this.cancelled.has(id)) {
			const part = randomBytes(Math.min(rawChunk, bytes - sent.bytes))
			hash.update(part)
			sent.bytes += part.length
			sent.chunks += 1
			await this.sendPaced(
				JSON.stringify({
					t: 'chunk',
					id,
					data: part.toString('base64'),
					...moreWhen(sent.bytes < bytes),
				}),
			)
			if (dropAfterChunks && sent.chunks >= dropAfterChunks) {
				this.terminate()
				break
			}
		}
		return {
			...sent,
			sha256: hash.digest('hex'),
			cancelled: this.cancelled.has(id),
		}
	}

	// The `req` frames seen so far for which the hub has given no answer yet are the test's to
	// track; this waits until `count` requests arrived.
	async untilRequests(count, timeoutMs) {
		const deadline = Date.now() + timeoutMs
		while (this.requests.length < count) {
			if (Date.now() > deadline)
				throw new Error(
					`${this.requests.length} of ${count} requests within ${timeoutMs} ms`,
				)
			await delay(TICK_MS * 2)
		}
	}

	#received(text) {
		const at = Date.now()
		const isPong = text === PONG_TEXT
		if (isPong) this.pongs += 1
		const frame = isPong ? { t: 'o' } : parsed(text)
		this.frames.push({ text, frame, at, isPong })
		for (const wake of this.wakers) wake()
		if (frame?.t === 'snapshot?') this.#snapshotLater(frame.tag)
		if (frame?.t === 'cancel') {
			this.cancels.push(frame.id)
			this.cancelled.add(frame.id)
		}
		if (frame?.t === 'req') {
			this.requests.push({ ...frame, at })
			this.handler?.(frame)
		}
	}

	// A tab connecting asks every hub for a snapshot, tagged for that tab: the asks of a burst are
	// answered together, each tab its own snapshot (one for every tab when an ask had no tag).
	#snapshotLater(tag) {
		if (!this.#answerSnapshots) return
		if (typeof tag === 'string') this.#askedTags.add(tag)
		else this.#isAskedUntagged = true
		this.#snapshotTimer ??= setTimeout(() => {
			this.#snapshotTimer = null
			const tags = [...this.#askedTags]
			const isUntagged = this.#isAskedUntagged
			this.#askedTags.clear()
			this.#isAskedUntagged = false
			if (isUntagged) this.sayHello()
			else for (const each of tags) this.sayHello(each)
		}, SNAPSHOT_DEBOUNCE_MS)
	}

	#stopTimers() {
		clearInterval(this.#pingTimer)
		clearTimeout(this.#snapshotTimer)
		this.#pingTimer = null
		this.#snapshotTimer = null
	}
}

// The frames after `from` that are not the auto-response's pongs: what the object said besides.
export function spoken(hub, from = 0) {
	return hub.frames.slice(from).filter(each => !each.isPong)
}

// `{ tag }` on a snapshot for the one tab it names, nothing on one for every tab.
function taggedFor(tag) {
	if (!tag) return undefined
	return { tag }
}

// `{ more: true }` while an answer goes on, nothing on its last frame (the wire says `true` or
// leaves it out).
function moreWhen(isMore) {
	if (!isMore) return undefined
	return { more: true }
}

function parsed(text) {
	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}
