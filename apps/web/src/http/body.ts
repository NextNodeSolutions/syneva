// A request's body read under a cap, refused past it before it is held whole: the Worker bounds
// every body it reads (RFC 6.3 R9), so the object only ever receives text the Worker already read.
import { fail } from './answer.js'
import { HTTP_BAD_REQUEST, HTTP_PAYLOAD_TOO_LARGE } from './status.js'

import type { Failure } from './answer.js'

export type BodyRead = { text: string } | { refusal: Response }

type Progress = { text: string; size: number }

// The body as text, or the 413 that refuses it; '' when there is none.
export async function readText(
	request: Request,
	cap: number,
): Promise<BodyRead> {
	const declared = Number(request.headers.get('content-length') ?? '0')
	if (declared > cap) return { refusal: fail(tooLarge(cap)) }
	if (!request.body) return { text: '' }
	const text = await readCapped(
		request.body.getReader(),
		new TextDecoder(),
		cap,
		{ text: '', size: 0 },
	)
	if (text === null) return { refusal: fail(tooLarge(cap)) }
	return { text }
}

// A JSON body under the cap: the parsed value, or the 400 or 413 that refuses it.
export async function readJson(
	request: Request,
	cap: number,
): Promise<{ parsed: unknown } | { refusal: Response }> {
	const read = await readText(request, cap)
	if ('refusal' in read) return read
	try {
		return { parsed: JSON.parse(read.text) }
	} catch {
		return {
			refusal: fail({
				status: HTTP_BAD_REQUEST,
				code: 'INVALID_JSON',
				error: 'Request body is not valid JSON.',
			}),
		}
	}
}

// One chunk after the other (a stream's next chunk is read once the one before is counted); null
// once past the cap, the rest cancelled unread.
async function readCapped(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	decoder: TextDecoder,
	cap: number,
	progress: Progress,
): Promise<string | null> {
	const { done: isDone, value: chunk } = await reader.read()
	if (isDone) return progress.text + decoder.decode()
	const size = progress.size + chunk.byteLength
	if (size > cap) {
		await reader.cancel()
		return null
	}
	const text = progress.text + decoder.decode(chunk, { stream: true })
	return readCapped(reader, decoder, cap, { text, size })
}

function tooLarge(cap: number): Failure {
	return {
		status: HTTP_PAYLOAD_TOO_LARGE,
		code: 'TOO_LARGE',
		error: `Request body over ${cap} bytes.`,
	}
}
