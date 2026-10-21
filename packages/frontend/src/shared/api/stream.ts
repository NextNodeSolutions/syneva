// The hub's stream as a tab reads it (RFC 0001, 4.3 and 4.6): one WebSocket to the page's own
// origin, the frames it carries, and the client policy every close code asks for. It owns three
// timers and no other: the ping, the pong's deadline and the wait before the next attempt.
// Nothing here re-asks for state: a reconnect's snapshot is the only resync.
import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	CLOSE_CODES,
	PING_TEXT,
	PONG_TEXT,
} from '@syneva/contracts/bridge'

import { readFrame } from './stream-frame'

import type { StreamFrame } from './stream-frame'

// How the stream stands. `backoff`, `too-many` and `saturated` wait until `retryAt`, then try
// again; `signed-out` never does (the page signs in again, and reloads).
export type StreamLink =
	| { kind: 'connecting' }
	| { kind: 'live'; since: number }
	| { kind: 'backoff'; retryAt: number }
	| { kind: 'too-many'; retryAt: number }
	| { kind: 'saturated'; retryAt: number }
	| { kind: 'signed-out' }

// Why the last socket ended: the code it closed with, or `no-pong` when the tab dropped one that
// stopped answering its pings.
export type StreamClose = { code: number | 'no-pong'; at: number }

export type StreamState = { link: StreamLink; lastClose: StreamClose | null }

export type StreamReader = {
	onFrame: (frame: StreamFrame) => void
	onState: (state: StreamState) => void
}

export type HubStream = { stop: () => void }

type Waiting = Extract<StreamLink, { retryAt: number }>['kind']

const HTTP_UNAUTHORIZED = 401
const NORMAL_CLOSURE = 1000
const BACKOFF_BASE = 2

// The close codes that name a wait before the next attempt (RFC 4.3), and what the tab says
// meanwhile: a rate close waits, then backs off as any other; the other two say why they wait.
const WAITS: ReadonlyMap<number, { kind: Waiting; ms: number }> = new Map<
	number,
	{ kind: Waiting; ms: number }
>([
	[CLOSE_CODES.rate, { kind: 'backoff', ms: BRIDGE_LIMITS.rateWaitMs }],
	[
		CLOSE_CODES.tooMany,
		{ kind: 'too-many', ms: BRIDGE_LIMITS.tooManyWaitMs },
	],
	[
		CLOSE_CODES.saturated,
		{ kind: 'saturated', ms: BRIDGE_LIMITS.saturatedWaitMs },
	],
])

function socketUrl(): string {
	const url = new URL(BRIDGE_PATHS.tabSocket, window.location.href)
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
	return url.href
}

// A frame that does not read is a hub's bug (the conformance check guards the frames): dropped,
// the stream goes on.
function parsed(text: string): StreamFrame | null {
	try {
		return readFrame(text)
	} catch {
		return null
	}
}

// The HTTP status the upgrade was refused with, which a browser's WebSocket never tells. A plain
// GET of the stream's own path passes the same guards as its upgrade, so it reads the same 401;
// the hub's health probe answers before the access guard and could not. Null when nothing
// answered.
async function upgradeStatus(): Promise<number | null> {
	try {
		const response = await fetch(BRIDGE_PATHS.tabSocket, {
			cache: 'no-store',
		})
		return response.status
	} catch {
		return null
	}
}

class StreamClient {
	readonly #reader: StreamReader
	#socket: WebSocket | null = null
	#state: StreamState = { link: { kind: 'connecting' }, lastClose: null }
	// Attempts since the hub last said hello: the exponent of the backoff's ceiling.
	#attempt = 0
	#isStopped = false
	#retry: ReturnType<typeof setTimeout> | undefined
	#ping: ReturnType<typeof setInterval> | undefined
	#pong: ReturnType<typeof setTimeout> | undefined

	constructor(reader: StreamReader) {
		this.#reader = reader
	}

	connect(): void {
		if (this.#isStopped) return
		this.#publish({ kind: 'connecting' })
		const socket = new WebSocket(socketUrl())
		this.#socket = socket
		// A socket this client let go of (stopped, or dropped for its silence) speaks no more.
		const isCurrent = (): boolean => this.#socket === socket
		socket.addEventListener('open', () => {
			if (isCurrent()) this.#opened()
		})
		socket.addEventListener('message', event => {
			if (isCurrent()) this.#received(event.data)
		})
		socket.addEventListener('close', event => {
			if (isCurrent()) this.#closed(event.code)
		})
	}

	stop(): void {
		this.#isStopped = true
		clearTimeout(this.#retry)
		this.#socket?.close(NORMAL_CLOSURE)
		this.#release()
	}

	#opened(): void {
		this.#publish({ kind: 'live', since: Date.now() })
		this.#ping = setInterval(() => {
			this.#sendPing()
		}, BRIDGE_LIMITS.pingIntervalMs)
	}

	#received(message: unknown): void {
		if (typeof message !== 'string') return
		if (message === PONG_TEXT) {
			clearTimeout(this.#pong)
			this.#pong = undefined
			return
		}
		const frame = parsed(message)
		if (!frame) return
		if (frame.t === 'hello') this.#attempt = 0
		this.#reader.onFrame(frame)
	}

	#sendPing(): void {
		this.#socket?.send(PING_TEXT)
		this.#pong ??= setTimeout(() => {
			this.#unanswered()
		}, BRIDGE_LIMITS.pongTimeoutMs)
	}

	// No pong within its deadline: the socket is let go of at once (a dead peer would hold the
	// close handshake open) and the stream backs off as after any drop.
	#unanswered(): void {
		this.#socket?.close(NORMAL_CLOSURE)
		this.#release()
		this.#ended('no-pong')
		this.#backoff()
	}

	#closed(code: number): void {
		const wasLive = this.#state.link.kind === 'live'
		this.#release()
		this.#ended(code)
		const wait = WAITS.get(code)
		if (code === CLOSE_CODES.revoked) this.#publish({ kind: 'signed-out' })
		else if (wait) this.#hold(wait.kind, wait.ms)
		else if (wasLive) this.#backoff()
		else void this.#refused()
	}

	// A socket that closed before it opened was refused or never reached the hub: a 401 is a
	// sign-in that no longer opens it (stop, as `revoked`), anything else backs off.
	async #refused(): Promise<void> {
		const status = await upgradeStatus()
		if (this.#isStopped) return
		if (status === HTTP_UNAUTHORIZED) this.#publish({ kind: 'signed-out' })
		else this.#backoff()
	}

	// Exponential from backoffMinMs, capped at backoffMaxMs, with full jitter: a fleet of tabs
	// that dropped together (a deploy, a hub restart) spreads its reconnects.
	#backoff(): void {
		const ceiling = Math.min(
			BRIDGE_LIMITS.backoffMaxMs,
			BRIDGE_LIMITS.backoffMinMs * BACKOFF_BASE ** this.#attempt,
		)
		this.#attempt += 1
		this.#hold('backoff', Math.random() * ceiling)
	}

	#hold(kind: Waiting, ms: number): void {
		if (this.#isStopped) return
		this.#publish({ kind, retryAt: Date.now() + ms })
		this.#retry = setTimeout(() => {
			this.connect()
		}, ms)
	}

	// Lets go of the socket and its ping timers: a close the socket still fires (always later,
	// never during close()) finds it no longer current.
	#release(): void {
		this.#socket = null
		clearInterval(this.#ping)
		clearTimeout(this.#pong)
		this.#ping = undefined
		this.#pong = undefined
	}

	#ended(code: StreamClose['code']): void {
		this.#state = { ...this.#state, lastClose: { code, at: Date.now() } }
	}

	#publish(link: StreamLink): void {
		this.#state = { ...this.#state, link }
		this.#reader.onState(this.#state)
	}
}

// Opens the stream and keeps it open, reconnecting by RFC 4.3's policy, until `stop`.
export function openHubStream(reader: StreamReader): HubStream {
	const client = new StreamClient(reader)
	client.connect()
	return {
		stop: () => {
			client.stop()
		},
	}
}
