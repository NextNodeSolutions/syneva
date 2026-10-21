// One socket from the probe to the web's bridge (RFC 0001, 4.3): opened with the hub's token as a
// Bearer, it carries the hub's stream up and the web's `snapshot?`, `req` and `cancel` down, and
// keeps a ping every `pingIntervalMs` answered within `pongTimeoutMs`. It ends once, with how it
// ended (policy.ts reads that); the probe decides what comes next.
import {
	BRIDGE_LIMITS,
	BRIDGE_PATHS,
	PING_TEXT,
	PONG_TEXT,
} from '@syneva/contracts/bridge'
import { WebSocket } from 'ws'

import { startLinkStream } from './link-stream.js'
import { createOutbox } from './outbox.js'

import type { BridgeFrame } from '@syneva/contracts/bridge'
import type { StreamSource } from '@syneva/core/hub/stream-frames'
import type { ClientOptions, RawData } from 'ws'
import type { Outbox } from './outbox.js'
import type { AttemptEnd } from './policy.js'

// The web's relay as a socket serves it (relay.ts): requests in, their answers through the
// outbox.
export type RelayChannel = {
	request(frame: Extract<BridgeFrame, { t: 'req' }>): void
	// A `req` with an id but fields that do not read: answered 400, never dispatched.
	malformed(id: string): void
	cancel(id: string): void
	// The socket closed: every request still in flight is aborted, its answer never sent.
	close(): void
}

export type LinkDeps = {
	web: string
	token: string
	source: StreamSource
	relay?: ((outbox: Outbox) => RelayChannel) | undefined
	// Multiplies the ping interval and the pong deadline (1 outside tests).
	scale: number
	log: (line: string) => void
}

export type LinkEvents = {
	opened(): void
	// A pong came back: the web answers on this socket.
	answered(): void
	ended(end: AttemptEnd): void
}

export type Link = { close(code: number): void }

// A `req` carries a body of up to `requestBodyBytes` inside its envelope, so a frame from the web
// may exceed `frameBytes` by that much; nothing else it sends comes near.
const INBOUND_FRAME_BYTES =
	BRIDGE_LIMITS.frameBytes + BRIDGE_LIMITS.requestBodyBytes

// ws waits `closeTimeout` for the web to answer a close before dropping the socket: the bridge's
// bound on an answer rather than ws's 30 s (an option @types/ws does not declare yet).
const CLIENT_OPTIONS: ClientOptions & { closeTimeout: number } = {
	handshakeTimeout: BRIDGE_LIMITS.pongTimeoutMs,
	maxPayload: INBOUND_FRAME_BYTES,
	perMessageDeflate: false,
	closeTimeout: BRIDGE_LIMITS.pongTimeoutMs,
}

export function socketUrl(web: string): string {
	const url = new URL(BRIDGE_PATHS.hubSocket, web)
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
	return url.href
}

export function openLink(deps: LinkDeps, events: LinkEvents): Link {
	const socket = new WebSocket(socketUrl(deps.web), {
		...CLIENT_OPTIONS,
		headers: { authorization: `Bearer ${deps.token}` },
	})
	// What ended the attempt, when the socket's close does not say it (a refusal, a failure before
	// the upgrade, a silent web); the close itself reports once, last.
	let cause: AttemptEnd | null = null
	let session: (() => void) | null = null
	socket.on('unexpected-response', (_request, response) => {
		response.resume()
		cause ??= { kind: 'refused', status: response.statusCode ?? 0 }
		socket.terminate()
	})
	socket.on('error', error => {
		if (socket.readyState !== socket.OPEN)
			cause ??= { kind: 'failed', reason: error.message }
	})
	socket.once('open', () => {
		events.opened()
		session = startSession(socket, deps, events, () => {
			cause ??= { kind: 'silent' }
			socket.terminate()
		})
	})
	socket.once('close', (code, reason) => {
		session?.()
		events.ended(
			cause ?? { kind: 'closed', code, reason: reason.toString('utf8') },
		)
	})
	return {
		close(code): void {
			if (socket.readyState === socket.CONNECTING) socket.terminate()
			else socket.close(code)
		},
	}
}

// The socket's life once open: the stream up, the relay down, the pings. Hands back its end.
function startSession(
	socket: WebSocket,
	deps: LinkDeps,
	events: LinkEvents,
	silent: () => void,
): () => void {
	const outbox = createOutbox(socket)
	const stream = startLinkStream(deps.source, outbox, deps.log)
	const relay = deps.relay?.(outbox)
	const pings = startPings(outbox, deps.scale, silent)
	socket.on('message', (message, isBinary) => {
		if (isBinary) return
		const text = textOf(message)
		if (text === PONG_TEXT) {
			pings.answered()
			events.answered()
			return
		}
		received(parsed(text), stream.resnapshot, relay)
	})
	return () => {
		pings.stop()
		stream.stop()
		relay?.close()
		outbox.close()
	}
}

// What the web sends a hub, plus a `req` whose fields do not read (its id does: it is answered).
type WebFrame = BridgeFrame | { t: 'malformed-req'; id: string }

function received(
	frame: WebFrame | null,
	resnapshot: (tag?: string) => void,
	relay: RelayChannel | undefined,
): void {
	if (frame?.t === 'snapshot?') resnapshot(frame.tag)
	else if (frame?.t === 'req') relay?.request(frame)
	else if (frame?.t === 'malformed-req') relay?.malformed(frame.id)
	else if (frame?.t === 'cancel') relay?.cancel(frame.id)
}

// A ping every interval; its pong's deadline starts once the ping is written (the outbox may hold
// it behind a relayed answer's frames), and one ping waits for its pong at a time.
function startPings(
	outbox: Outbox,
	scale: number,
	silent: () => void,
): { answered(): void; stop(): void } {
	let deadline: NodeJS.Timeout | undefined
	const arm = (): void => {
		deadline ??= setTimeout(silent, BRIDGE_LIMITS.pongTimeoutMs * scale)
	}
	const interval = setInterval(() => {
		if (!deadline) outbox.send(PING_TEXT, arm)
	}, BRIDGE_LIMITS.pingIntervalMs * scale)
	return {
		answered(): void {
			clearTimeout(deadline)
			deadline = undefined
		},
		stop(): void {
			clearInterval(interval)
			clearTimeout(deadline)
		},
	}
}

function textOf(message: RawData): string {
	return Buffer.isBuffer(message) ? message.toString('utf8') : ''
}

// The frames the web sends a hub; anything else (a kind a newer web sends, text that is no frame)
// is passed over.
function parsed(text: string): WebFrame | null {
	let raw: unknown
	try {
		raw = JSON.parse(text)
	} catch {
		return null
	}
	return webFrame(raw)
}

function webFrame(raw: unknown): WebFrame | null {
	if (typeof raw !== 'object' || raw === null || !('t' in raw)) return null
	if (raw.t === 'snapshot?') return snapshotAsk(raw)
	if (!('id' in raw) || typeof raw.id !== 'string') return null
	if (raw.t === 'cancel') return { t: 'cancel', id: raw.id }
	if (raw.t !== 'req') return null
	return requestFrame(raw.id, raw)
}

// A tag that does not read (not text, empty, past `snapshotTagChars`) is never echoed (the web
// would close the socket on the frames carrying it): the snapshot then goes to every tab.
function snapshotAsk(raw: object): WebFrame {
	const tag = 'tag' in raw ? raw.tag : undefined
	const isTag =
		typeof tag === 'string' &&
		tag.length > 0 &&
		tag.length <= BRIDGE_LIMITS.snapshotTagChars
	if (!isTag) return { t: 'snapshot?' }
	return { t: 'snapshot?', tag }
}

function requestFrame(id: string, raw: object): WebFrame {
	const fields: Record<string, unknown> = Object.fromEntries(
		Object.entries(raw),
	)
	const { method, path, query, body } = fields
	const malformed = { t: 'malformed-req', id } as const
	if (method !== 'GET' && method !== 'POST' && method !== 'DELETE')
		return malformed
	if (typeof path !== 'string' || typeof query !== 'string') return malformed
	if (typeof body === 'string')
		return { t: 'req', id, method, path, query, body }
	if ('body' in fields) return malformed
	return { t: 'req', id, method, path, query }
}
