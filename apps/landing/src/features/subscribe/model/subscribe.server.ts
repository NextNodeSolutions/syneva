import { EMAIL_FIELD, EMAIL_MAX_LENGTH, TRAP_FIELD } from './endpoint'
import { logFailure } from './log-failure.server'

import type { Outcome } from './outcome'

// What a signup writes to, counts against and sends with: the list (D1), the
// per-client limiter and the welcome email, all wired by the route from the
// Worker's bindings.
export type SignupBindings = {
	list: D1Database
	limiter: RateLimit
	welcome: (email: string) => Promise<void>
}

// Two short fields; a body any longer is not this form's.
const MAX_BODY_BYTES = 2048
// Something@something.something: the browser's own check, repeated for
// clients that skip it. Whether the address receives mail is for the welcome
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

// Whether the address joined the list now (it was not on it already).
async function addSubscriber(
	list: D1Database,
	email: string,
): Promise<boolean> {
	const { meta } = await list.prepare(INSERT_SUBSCRIBER).bind(email).run()
	return meta.changes > 0
}

// One signup from a posted form. Every try counts against the client's limit,
// a valid one included, before the body is read. Only a new address is
// welcomed, and a welcome that fails leaves the signup standing: the address
// is on the list.
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
