// Everything the probe sends goes out here, at the pace of send-window.ts, in two lanes: the
// ordered lane (`hello`, the snapshot, the stream's frames, pings, a relay's `res` or `err`) in
// the order given, and behind it the relays' bodies, one `chunk` frame from each in turn, so a
// large answer neither holds the stream back nor starves a smaller one. A body is cut into frames
// when its turn comes: what waits is its bytes, never their base64. The one timer here waits for
// the window to have room.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

import { EMPTY_WINDOW, sendableAt, withSent } from './send-window.js'

import type { BridgeFrame } from '@syneva/contracts/bridge'
import type { WebSocket } from 'ws'
import type { SendWindow } from './send-window.js'

// Base64 spells every 3 bytes as 4 characters.
const BASE64_CHARACTERS = 4
const BASE64_BYTES = 3
// Raw bytes per chunk: their base64 is exactly `chunkBytes`, so a chunk frame, envelope
// included, stays under `frameBytes`.
export const CHUNK_RAW_BYTES =
	(BRIDGE_LIMITS.chunkBytes / BASE64_CHARACTERS) * BASE64_BYTES

export type Outbox = {
	// `sent` runs once the frame is written to the socket (never when it closed first); a frame
	// that answers a relay names it, so a cancel catches it while it waits.
	send(text: string, sent?: () => void, relay?: string): void
	// A relay's body after its `res { more: true }`: its chunks, the last one's `sent` runs
	// `sent`.
	stream(id: string, body: Uint8Array, sent: () => void): void
	// A cancelled relay: its frames still waiting never go.
	drop(id: string): void
	close(): void
}

// A relay's frame names it, so a cancel catches it even once it is next in line.
type Outgoing = {
	text: string
	sent: (() => void) | undefined
	relay?: string | undefined
}

type Body = { id: string; bytes: Uint8Array; offset: number; sent: () => void }

export function createOutbox(socket: WebSocket): Outbox {
	const lanes = new Lanes(socket)
	return {
		send(text, sent, relay): void {
			lanes.ordered.push({ text, sent, relay })
			lanes.wake()
		},
		stream(id, bytes, sent): void {
			lanes.bodies.push({ id, bytes, offset: 0, sent })
			lanes.wake()
		},
		drop(id): void {
			lanes.drop(id)
		},
		close(): void {
			lanes.close()
		},
	}
}

class Lanes {
	readonly ordered: Outgoing[] = []
	readonly bodies: Body[] = []
	readonly #socket: WebSocket
	#window: SendWindow = EMPTY_WINDOW
	// The frame whose turn it is, kept until the window has room for it.
	#next: Outgoing | null = null
	#timer: NodeJS.Timeout | undefined
	#isClosed = false

	constructor(socket: WebSocket) {
		this.#socket = socket
	}

	wake(): void {
		if (!this.#timer) this.#flush()
	}

	drop(id: string): void {
		const body = this.bodies.findIndex(each => each.id === id)
		if (body >= 0) this.bodies.splice(body, 1)
		const answer = this.ordered.findIndex(each => each.relay === id)
		if (answer >= 0) this.ordered.splice(answer, 1)
		if (this.#next?.relay === id) this.#next = null
	}

	close(): void {
		this.#isClosed = true
		clearTimeout(this.#timer)
	}

	// Sends what the window lets through, then waits for the room the next frame needs.
	#flush(): void {
		this.#timer = undefined
		let waitMs = 0
		while (!waitMs && this.#take()) waitMs = this.#sendNext()
		if (waitMs)
			this.#timer = setTimeout(() => {
				this.#flush()
			}, waitMs)
	}

	#take(): Outgoing | null {
		if (this.#isClosed) return null
		this.#next ??= this.ordered.shift() ?? nextChunk(this.bodies)
		return this.#next
	}

	// Sends the next frame, or says how long until the window has room for it.
	#sendNext(): number {
		const next = this.#next
		if (!next) return 0
		const now = Date.now()
		const bytes = Buffer.byteLength(next.text)
		const at = sendableAt(this.#window, bytes, now)
		if (at > now) return at - now
		this.#window = withSent(this.#window, bytes, now)
		this.#next = null
		write(this.#socket, next)
		return 0
	}
}

function write(socket: WebSocket, outgoing: Outgoing): void {
	if (socket.readyState !== socket.OPEN) return
	socket.send(outgoing.text, error => {
		if (!error) outgoing.sent?.()
	})
}

// The next chunk of the body whose turn it is; that body goes to the back of the line, or leaves
// it with its last chunk.
function nextChunk(bodies: Body[]): Outgoing | null {
	const body = bodies.shift()
	if (!body) return null
	const end = Math.min(body.offset + CHUNK_RAW_BYTES, body.bytes.length)
	const encoded = Buffer.from(
		body.bytes.buffer,
		body.bytes.byteOffset + body.offset,
		end - body.offset,
	).toString('base64')
	body.offset = end
	const isLast = end >= body.bytes.length
	const frame: BridgeFrame = isLast
		? { t: 'chunk', id: body.id, data: encoded }
		: { t: 'chunk', id: body.id, data: encoded, more: true }
	if (!isLast) bodies.push(body)
	return {
		text: JSON.stringify(frame),
		sent: isLast ? body.sent : undefined,
		relay: body.id,
	}
}
