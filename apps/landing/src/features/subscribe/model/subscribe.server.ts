import { EMAIL_FIELD, EMAIL_MAX_LENGTH, TRAP_FIELD } from './endpoint'
import { logFailure } from './log-failure.server'

import type { Outcome } from './outcome'

export type SignupBindings = {
	list: D1Database
	limiter: RateLimit
	welcome: (email: string) => Promise<void>
}

const MAX_BODY_BYTES = 2048
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The address keeps the case it was typed in; the column's NOCASE collation makes it unique regardless (migrations/0001_subscribers.sql).
const INSERT_SUBSCRIBER =
	'INSERT INTO subscribers (email) VALUES (?1) ON CONFLICT (email) DO NOTHING'

// The body as it streams in, failing once it outgrows the cap.
// Measured on the bytes themselves: a Content-Length header is optional, and a client can leave it out.
function capped(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	let received = 0
	return body.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				received += chunk.byteLength
				if (received > MAX_BODY_BYTES)
					controller.error(new RangeError('signup body over the cap'))
				else controller.enqueue(chunk)
			},
		}),
	)
}

async function readForm(request: Request): Promise<FormData | undefined> {
	if (!request.body) return undefined
	const contentType = request.headers.get('content-type') ?? ''
	try {
		return await new Response(capped(request.body), {
			headers: { 'content-type': contentType },
		}).formData()
	} catch {
		return undefined
	}
}

function emailOf(form: FormData): string | undefined {
	const submitted = form.get(EMAIL_FIELD)
	if (typeof submitted !== 'string') return undefined
	const email = submitted.trim()
	if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email))
		return undefined
	return email
}

const isTrapped = (form: FormData): boolean => Boolean(form.get(TRAP_FIELD))

async function addSubscriber(
	list: D1Database,
	email: string,
): Promise<boolean> {
	const { meta } = await list.prepare(INSERT_SUBSCRIBER).bind(email).run()
	return meta.changes > 0
}

// Every try counts against the client's limit, a valid one included, before the body is read; only a new address is welcomed, and a failed welcome leaves the signup standing.
export async function subscribe(
	request: Request,
	client: string,
	bindings: SignupBindings,
): Promise<Outcome> {
	const { success } = await bindings.limiter.limit({ key: client })
	if (!success) return 'limited'
	const form = await readForm(request)
	if (!form) return 'invalid'
	if (isTrapped(form)) return 'subscribed'
	const email = emailOf(form)
	if (!email) return 'invalid'
	try {
		if (!(await addSubscriber(bindings.list, email))) return 'subscribed'
	} catch (error) {
		logFailure('subscribe.failed', error)
		return 'failed'
	}
	try {
		await bindings.welcome(email)
	} catch (error) {
		logFailure('subscribe.welcome-failed', error)
	}
	return 'subscribed'
}
