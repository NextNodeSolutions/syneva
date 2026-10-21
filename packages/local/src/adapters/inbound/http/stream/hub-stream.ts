// One reader of the hub's stream (GET /api/hub/ws): `hello`, the snapshot, then every hub signal
// as frames, paced by the coalescer below. The tab only ever sends pings.
import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	PING_TEXT,
	PONG_TEXT,
} from '@syneva/contracts/bridge'
import { createStreamQueue } from '@syneva/core/hub/stream-queue'
import { fullBucket, spendFrame } from '@syneva/core/hub/stream-rate'

import type { StreamSource } from '@syneva/core/hub/stream-frames'
import type { StreamQueue } from '@syneva/core/hub/stream-queue'
import type { RawData, WebSocket } from 'ws'

export type StreamDeps = {
	source: StreamSource
	log: (line: string) => void
	// A frame over `frameBytes` was refused, named by its head (its kind and desk).
	oversized: (head: string) => void
}

// Starts the stream on an accepted socket; hands back its end, which the socket's close calls.
export function openHubStream(socket: WebSocket, deps: StreamDeps): () => void {
	const queue = createStreamQueue(deps.source)
	const send = sender(socket, deps.oversized)
	const pacer = createPacer(queue, send)
	const unsubscribe = deps.source.hub.subscribe(signal => {
		queue.note(signal)
		pacer.wake()
	})
	listenForPings(socket)
	const drop = (error: unknown): void => {
		deps.log(`stream: snapshot failed: ${String(error)}`)
		socket.terminate()
	}
	void begin({ queue, send, pacer, drop })
	return () => {
		unsubscribe()
		pacer.stop()
	}
}

type Send = (text: string) => boolean

type Pacer = { start(): void; wake(): void; stop(): void }

// `hello` at once, the snapshot once read, then the events; nothing more once the socket went
// away. A snapshot that cannot be read leaves the tab without one: the socket is dropped (the
// client reconnects with its backoff), with no close code to act on.
async function begin(stream: {
	queue: StreamQueue
	send: Send
	pacer: Pacer
	drop: (error: unknown) => void
}): Promise<void> {
	const { queue, send, pacer } = stream
	if (!send(queue.hello())) return
	let snapshot: string[]
	try {
		snapshot = await queue.snapshot()
	} catch (error) {
		stream.drop(error)
		return
	}
	if (snapshot.every(send)) pacer.start()
}

// Core shapes every frame under `frameBytes` (a pulse past it travels partial, the journal splits
// its batches), so a frame past it is a hub bug: said once per head and never sent, while the
// stream goes on. Closing the socket would not help: every reconnect's snapshot would meet the
// same frame again, and the tab would never stay connected.
function sender(socket: WebSocket, oversized: (head: string) => void): Send {
	return text => {
		if (socket.readyState !== socket.OPEN) return false
		if (Buffer.byteLength(text) > BRIDGE_LIMITS.frameBytes)
			oversized(text.slice(0, FRAME_HEAD_CHARS))
		else socket.send(text)
		return true
	}
}

// The coalescer's clock: one timer per stream, armed for the queue's next due time (the next
// window once frames wait, or a desk's status going stale on its own) and never earlier than the
// timer already armed. The one timer of the stream: the hub pushes, nothing here re-asks.
function createPacer(queue: StreamQueue, send: Send): Pacer {
	let timer: NodeJS.Timeout | undefined
	let armedFor = Infinity
	let isLive = false
	const fire = (): void => {
		timer = undefined
		armedFor = Infinity
		if (!queue.take(Date.now()).every(send)) return
		wake()
	}
	const wake = (): void => {
		const due = isLive ? queue.dueAt() : null
		if (due === null || due >= armedFor) return
		clearTimeout(timer)
		armedFor = due
		timer = setTimeout(fire, Math.max(0, due - Date.now()))
	}
	return {
		start(): void {
			isLive = true
			wake()
		},
		wake,
		stop(): void {
			isLive = false
			clearTimeout(timer)
		},
	}
}

// Every inbound frame spends the socket's budget (stream-rate.ts) - the protocol's own pings
// too - and a sustained excess closes it with `rate`. Of the bridge's frames a tab sends pings
// only, spelled exactly; anything else closes it with `malformed`.
function listenForPings(socket: WebSocket): void {
	let bucket = fullBucket(Date.now())
	const spend = (size: number): boolean => {
		const next = spendFrame(bucket, size, Date.now())
		if (next) bucket = next
		else socket.close(CLOSE_CODES.rate)
		return next !== null
	}
	socket.on('message', (message, isBinary) => {
		if (socket.readyState !== socket.OPEN || !spend(byteSize(message)))
			return
		if (!isBinary && textOf(message) === PING_TEXT) socket.send(PONG_TEXT)
		else socket.close(CLOSE_CODES.malformed)
	})
	socket.on('ping', payload => {
		spend(payload.length)
	})
}

function byteSize(message: RawData): number {
	if (Array.isArray(message))
		return message.reduce((total, chunk) => total + chunk.length, 0)
	return message instanceof ArrayBuffer ? message.byteLength : message.length
}

function textOf(message: RawData): string {
	return Buffer.isBuffer(message) ? message.toString('utf8') : ''
}

// A frame is named by its head: its kind, hub and desk id (`{"t":"pulse","hubId":"local","deskId":
// "<16 hex>"` fits), never its content.
const FRAME_HEAD_CHARS = 64
