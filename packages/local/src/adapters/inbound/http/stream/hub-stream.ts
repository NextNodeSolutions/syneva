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
	const write = writer(socket, deps.oversized)
	const pacer = createPacer(queue, keptUp(socket, write))
	const unsubscribe = deps.source.hub.subscribe(signal => {
		queue.note(signal)
		pacer.wake()
	})
	listenForPings(socket)
	const stopListening = closeWhenSilent(socket)
	const drop = (error: unknown): void => {
		deps.log(`stream: snapshot failed: ${String(error)}`)
		socket.terminate()
	}
	void begin({ queue, write, pacer, drop })
	return () => {
		unsubscribe()
		pacer.stop()
		stopListening()
	}
}

// Sends one frame, false once the socket can take no more; `written` runs once the frame is
// written out to the socket (never when it closed first).
type Send = (text: string, written?: () => void) => boolean

type Pacer = { start(): void; wake(): void; stop(): void }

// `hello` at once, the snapshot once read, then the events once the snapshot is written out:
// meanwhile the queue coalesces what moves (latest wins), so a slow link reads the latest state
// once rather than a backlog piled behind the snapshot, and a reader's lag (`keptUp`) counts from
// there. Nothing more once the socket went away. A snapshot that cannot be read leaves the tab
// without one: the socket is dropped (the client reconnects with its backoff), with no close code
// to act on.
async function begin(stream: {
	queue: StreamQueue
	write: Send
	pacer: Pacer
	drop: (error: unknown) => void
}): Promise<void> {
	const { queue, write, pacer } = stream
	if (!write(queue.hello())) return
	let snapshot: string[]
	try {
		snapshot = await queue.snapshot()
	} catch (error) {
		stream.drop(error)
		return
	}
	const last = snapshot.length - 1
	const goLive = (): void => {
		pacer.start()
	}
	for (const [at, text] of snapshot.entries())
		if (!write(text, at === last ? goLive : undefined)) return
}

// Core shapes every frame under `frameBytes` (a pulse past it travels partial, the journal splits
// its batches), so a frame past it is a hub bug: said once per head and never sent, while the
// stream goes on. Closing the socket would not help: every reconnect's snapshot would meet the
// same frame again, and the tab would never stay connected.
function writer(socket: WebSocket, oversized: (head: string) => void): Send {
	return (text, written) => {
		if (socket.readyState !== socket.OPEN) return false
		if (Buffer.byteLength(text) > BRIDGE_LIMITS.frameBytes) {
			oversized(text.slice(0, FRAME_HEAD_CHARS))
			return true
		}
		socket.send(text, error => {
			if (!error) written?.()
		})
		return true
	}
}

// A live frame is queued only behind less than `bufferedBytes` its reader left unread: a tab that
// stopped reading (its page stuck, a link that crawls) would otherwise grow the hub by every frame
// sent its way. Past it the reader is closed with `slow` and reconnects to a fresh snapshot; the
// close waits behind what is buffered, and a reader that never gets to it is dropped after ws's
// close timeout, its buffer with it.
function keptUp(socket: WebSocket, write: Send): Send {
	return text => {
		if (socket.bufferedAmount <= BRIDGE_LIMITS.bufferedBytes)
			return write(text)
		socket.close(CLOSE_CODES.slow)
		return false
	}
}

// The coalescer's clock: one timer per stream, armed for the queue's next due time (the next
// window once frames wait, or a desk's status going stale on its own) and never earlier than the
// timer already armed. Beside the silence bound below, the one timer of the stream: the hub
// pushes, nothing here re-asks. It waits for `start` (the snapshot written out), and a stopped
// pacer never starts again.
function createPacer(queue: StreamQueue, send: Send): Pacer {
	let timer: NodeJS.Timeout | undefined
	let armedFor = Infinity
	let phase: 'waiting' | 'live' | 'stopped' = 'waiting'
	const fire = (): void => {
		timer = undefined
		armedFor = Infinity
		if (!queue.take(Date.now()).every(text => send(text))) return
		wake()
	}
	const wake = (): void => {
		const due = phase === 'live' ? queue.dueAt() : null
		if (due === null || due >= armedFor) return
		clearTimeout(timer)
		armedFor = due
		timer = setTimeout(fire, Math.max(0, due - Date.now()))
	}
	return {
		start(): void {
			if (phase !== 'waiting') return
			phase = 'live'
			wake()
		},
		wake,
		stop(): void {
			phase = 'stopped'
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

// A tab pings every `pingIntervalMs`; a socket silent past `silenceMs` has no tab behind it any
// more (a laptop asleep, a link dropped half-open: nothing tells the hub) or a frozen one. It is
// closed with `silent` so it leaves its subscription and its seat among `tabsPerUser`: a tab
// still there reconnects to a fresh snapshot, and a dead peer, which never answers the close, is
// dropped after ws's close timeout. Any inbound frame counts as heard; the stream's second timer.
function closeWhenSilent(socket: WebSocket): () => void {
	const silence = setTimeout(() => {
		socket.close(CLOSE_CODES.silent)
	}, BRIDGE_LIMITS.silenceMs)
	const heard = (): void => {
		silence.refresh()
	}
	socket.on('message', heard)
	socket.on('ping', heard)
	return () => {
		clearTimeout(silence)
	}
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
