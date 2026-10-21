// One relayed request inside the object (RFC 0001, 4.5): the Worker's `/relay` call waits on its
// answer; the hub's `res` gives the status and headers, its body, if it says `more`, streams to
// the Worker as its `chunk` frames arrive. The only module of the object that touches a stream,
// and the only place one is opened: an answer in one frame is a plain body.
//
// Bounded three ways: the answer's bytes (`responseBytes`, as the hub bounds it too), the bytes
// waiting for a slow reader (a few chunks: past that, the relay is cut, never buffered), and time
// (the Worker's deadline cancels it; `isStale` lets the object drop one whose cancel never came,
// compared on its next event, never on a timer).
import { BRIDGE_LIMITS, RELAY_FAILURE_STATUS } from '@syneva/contracts/bridge'

import type { RelayFailure } from '@syneva/contracts/bridge'
import type { RelayFrame } from './frames.js'

// What a frame did to its relay. `cut`: it is over and the hub must stop sending (a `cancel`
// goes); `malformed`: the hub broke the protocol, its socket closes.
export type RelayStep = 'open' | 'done' | 'cut' | 'malformed'

// Chunks waiting for the reader before the relay is cut: each is at most 576 KiB of bytes.
const QUEUED_CHUNKS = 2
// Twice the deadline: the Worker cancels at the deadline, so a relay this old lost its cancel.
const STALE_DEADLINES = 2
const STALE_MS = BRIDGE_LIMITS.deadlineMs * STALE_DEADLINES
const FIRST_STATUS = 200
const LAST_STATUS = 599
// A Response with one of these statuses carries no body.
const HTTP_NO_CONTENT = 204
const HTTP_RESET_CONTENT = 205
const HTTP_NOT_MODIFIED = 304
const NULL_BODY = new Set([
	HTTP_NO_CONTENT,
	HTTP_RESET_CONTENT,
	HTTP_NOT_MODIFIED,
])
// The headers a relayed answer keeps: what a JSON route or a `/blob` answer means by its body.
// Never a cookie (the web's own session is the only one its origin sets), never a length (the
// runtime counts), never a hop-by-hop header.
const KEPT_HEADERS = new Set([
	'content-type',
	'cache-control',
	'etag',
	'last-modified',
	'content-disposition',
	'vary',
])
// A relayed answer is the hub's bytes on the web's origin: never a page that runs (a `/blob`
// answer may be an SVG with a script in it), never sniffed into one.
const RELAYED_HEADERS: Readonly<Record<string, string>> = {
	'content-security-policy': "default-src 'none'; sandbox",
	'x-content-type-options': 'nosniff',
}

const FAILURE_WORDS: Readonly<Record<RelayFailure, string>> = {
	HUB_OFFLINE: 'The hub is not connected to the web.',
	HUB_TIMEOUT: 'The hub did not answer in time.',
	TOO_LARGE: "The hub's answer is over the relay's size limit.",
	TOO_MANY: 'Too many requests in flight to your hubs; retry in a moment.',
	CANCELLED: 'The hub dropped this request.',
}

export class Relay {
	readonly id: string
	readonly hubId: string
	readonly socketId: string
	readonly #startedAt: number
	readonly #answer = Promise.withResolvers<Response>()
	// The reader left (its stream was cancelled): the object drops the relay and tells the hub.
	readonly #onReaderGone: () => void
	#writer: WritableStreamDefaultWriter<Uint8Array> | null = null
	#isAnswered = false
	#isOver = false
	#bytes = 0

	constructor(
		ids: { id: string; hubId: string; socketId: string },
		startedAt: number,
		onReaderGone: () => void,
	) {
		this.id = ids.id
		this.hubId = ids.hubId
		this.socketId = ids.socketId
		this.#startedAt = startedAt
		this.#onReaderGone = onReaderGone
	}

	// What the Worker's `/relay` call answers: the hub's answer, or the relay's failure.
	get answer(): Promise<Response> {
		return this.#answer.promise
	}

	isStale(now: number): boolean {
		return now - this.#startedAt > STALE_MS
	}

	take(frame: RelayFrame): RelayStep {
		if (this.#isOver) return 'done'
		if (frame.t === 'err') return this.#failed(frame.code)
		if (frame.t === 'cancel') return this.#failed('CANCELLED')
		if (frame.t === 'res') return this.#head(frame)
		if (!this.#writer) return 'malformed'
		const bytes = decoded(frame.data)
		if (!bytes) return 'malformed'
		return this.#write(bytes, frame.more !== true)
	}

	// The relay ends without its answer: `failure` if nothing was answered yet, else the body cut.
	fail(failure: RelayFailure, status = RELAY_FAILURE_STATUS[failure]): void {
		if (this.#isOver) return
		this.#isOver = true
		if (!this.#isAnswered) {
			this.#isAnswered = true
			this.#answer.resolve(failureAnswer(failure, status))
			return
		}
		if (this.#writer) void cut(this.#writer, failure)
	}

	#failed(failure: RelayFailure): RelayStep {
		this.fail(failure)
		return 'done'
	}

	#head(frame: Extract<RelayFrame, { t: 'res' }>): RelayStep {
		if (this.#isAnswered) return 'malformed'
		const headers = keptHeaders(frame.headers)
		const { status } = frame
		if (!headers || !Number.isInteger(status)) return 'malformed'
		if (status < FIRST_STATUS || status > LAST_STATUS) return 'malformed'
		const bytes = decoded(frame.body ?? '')
		if (!bytes) return 'malformed'
		this.#bytes = bytes.byteLength
		if (this.#bytes > BRIDGE_LIMITS.responseBytes) return this.#tooLarge()
		this.#isAnswered = true
		if (NULL_BODY.has(status) || !frame.more) {
			this.#isOver = true
			this.#answer.resolve(
				new Response(bodyOf(status, bytes), { status, headers }),
			)
			return 'done'
		}
		const { readable, writable } = new TransformStream<
			Uint8Array,
			Uint8Array
		>()
		this.#writer = writable.getWriter()
		this.#answer.resolve(new Response(readable, { status, headers }))
		this.#bytes = 0
		return bytes.byteLength ? this.#write(bytes, false) : 'open'
	}

	#write(bytes: Uint8Array, isLast: boolean): RelayStep {
		const writer = this.#writer
		if (!writer) return 'malformed'
		this.#bytes += bytes.byteLength
		if (this.#bytes > BRIDGE_LIMITS.responseBytes) return this.#tooLarge()
		if ((writer.desiredSize ?? 0) < -QUEUED_CHUNKS) return this.#cut()
		void this.#written(writer, bytes)
		if (!isLast) return 'open'
		this.#isOver = true
		void closed(writer)
		return 'done'
	}

	#tooLarge(): RelayStep {
		this.fail('TOO_LARGE')
		return 'cut'
	}

	#cut(): RelayStep {
		this.fail('CANCELLED')
		return 'cut'
	}

	// A write the reader can no longer take: it left (its stream was cancelled).
	async #written(
		writer: WritableStreamDefaultWriter<Uint8Array>,
		bytes: Uint8Array,
	): Promise<void> {
		try {
			await writer.write(bytes)
		} catch {
			this.#readerGone()
		}
	}

	#readerGone(): void {
		if (this.#isOver) return
		this.#isOver = true
		this.#onReaderGone()
	}
}

// The failure as every refusal reads (`{ error, code }`), with the relay's status.
export function failureAnswer(failure: RelayFailure, status: number): Response {
	return new Response(
		JSON.stringify({ error: FAILURE_WORDS[failure], code: failure }),
		{
			status,
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store',
			},
		},
	)
}

// The hub's headers the answer keeps, and the web's own; null when one does not read as a header.
function keptHeaders(sent: Record<string, string>): Headers | null {
	const kept = Object.entries(sent).filter(([name]) =>
		KEPT_HEADERS.has(name.toLowerCase()),
	)
	try {
		return new Headers([...kept, ...Object.entries(RELAYED_HEADERS)])
	} catch {
		return null
	}
}

function bodyOf(status: number, bytes: Uint8Array): Uint8Array | null {
	if (NULL_BODY.has(status)) return null
	return bytes
}

// The answer cut mid-body: the reader sees its stream fail, never a short answer read as whole.
async function cut(
	writer: WritableStreamDefaultWriter<Uint8Array>,
	failure: RelayFailure,
): Promise<void> {
	try {
		await writer.abort(new Error(failure))
	} catch {
		// The reader already left: nothing to cut.
	}
}

async function closed(
	writer: WritableStreamDefaultWriter<Uint8Array>,
): Promise<void> {
	try {
		await writer.close()
	} catch {
		// The reader left after the last chunk: the answer was whole.
	}
}

// Base64 to bytes; null when it is not base64.
function decoded(base64: string): Uint8Array | null {
	let binary = ''
	try {
		binary = atob(base64)
	} catch {
		return null
	}
	const bytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index += 1)
		bytes[index] = binary.charCodeAt(index)
	return bytes
}
