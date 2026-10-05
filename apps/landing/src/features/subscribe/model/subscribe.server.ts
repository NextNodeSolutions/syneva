import { EMAIL_FIELD, EMAIL_MAX_LENGTH, TRAP_FIELD } from './endpoint'
import { logFailure } from './log-failure.server'

import type { Outcome } from './outcome'

// What a signup writes to and counts against: the list (D1) and the
// per-client limiter, both Worker bindings the route hands over.
export type SignupBindings = { list: D1Database; limiter: RateLimit }

// Two short fields; a body any longer is not this form's.
const MAX_BODY_BYTES = 2048
// Something@something.something: the browser's own check, repeated for
// clients that skip it. Whether the address receives mail is for the first
// email to find out.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The address keeps the case it was typed in; the column's NOCASE collation
// makes it unique regardless (migrations/0001_subscribers.sql).
const INSERT_SUBSCRIBER =
	'INSERT INTO subscribers (email) VALUES (?1) ON CONFLICT (email) DO NOTHING'

function hasFormSizedBody(request: Request): boolean {
	const length = Number(request.headers.get('content-length'))
	return length > 0 && length <= MAX_BODY_BYTES
}

async function readForm(request: Request): Promise<FormData | undefined> {
	try {
		return await request.formData()
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

// An address already on the list stays as it is.
async function addSubscriber(list: D1Database, email: string): Promise<void> {
	await list.prepare(INSERT_SUBSCRIBER).bind(email).run()
}

// One signup from a posted form. Every try counts against the client's limit,
// a valid one included, before the body is read.
export async function subscribe(
	request: Request,
	client: string,
	bindings: SignupBindings,
): Promise<Outcome> {
	if (!hasFormSizedBody(request)) return 'invalid'
	const { success } = await bindings.limiter.limit({ key: client })
	if (!success) return 'limited'
	const form = await readForm(request)
	if (!form) return 'invalid'
	if (isTrapped(form)) return 'subscribed'
	const email = emailOf(form)
	if (!email) return 'invalid'
	try {
		await addSubscriber(bindings.list, email)
	} catch (error) {
		logFailure('subscribe.failed', error)
		return 'failed'
	}
	return 'subscribed'
}
