import { logFailure } from './log-failure.server'
import { isTrapped, readForm, signupOf } from './read-signup.server'

import type { ListEmail } from './list-email'
import type { Outcome } from './outcome'
import type { Signup } from './signup'

export type SignupBindings = {
	list: D1Database
	limiter: RateLimit
	send: (to: string, kind: ListEmail) => Promise<void>
	// Keeps work running after the response is sent (the Worker's waitUntil).
	defer: (work: Promise<void>) => void
}

// The address keeps the case it was typed in; the column's NOCASE collation makes it unique regardless (migrations/0001_subscribers.sql).
// A second signup leaves the details as they were: whoever knows an address cannot rewrite what its owner left. It only stamps reminded_at, at most once a day, so whoever repeats the signup cannot flood the inbox (migrations/0003_reminded_at.sql).
const UPSERT_SUBSCRIBER = `INSERT INTO subscribers (email, name, agents) VALUES (?1, ?2, ?3)
ON CONFLICT (email) DO UPDATE SET reminded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE reminded_at IS NULL OR reminded_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')
RETURNING reminded_at`

type UpsertedRow = { reminded_at: string | null }

// The row the upsert returns names the email: a new row was never reminded (the welcome), a conflict past the day was just reminded (the note), and one inside it returns no row (no email).
async function listEmailFor(
	list: D1Database,
	{ email, name, agents }: Signup,
): Promise<ListEmail | undefined> {
	const row = await list
		.prepare(UPSERT_SUBSCRIBER)
		.bind(
			email,
			name || null,
			agents.length > 0 ? JSON.stringify(agents) : null,
		)
		.first<UpsertedRow>()
	if (!row) return undefined
	return row.reminded_at === null ? 'welcome' : 'already-listed'
}

// A failed email is logged, never thrown: the signup it follows already stands.
async function notify(
	bindings: SignupBindings,
	email: string,
	kind: ListEmail,
): Promise<void> {
	try {
		await bindings.send(email, kind)
	} catch (error) {
		logFailure(`subscribe.${kind}-failed`, error)
	}
}

// Every try counts against the client's limit, a valid one included, before the body is read. A new address is welcomed and one already on the list is told so, both after the answer is sent (the email never changes it), and a failed email leaves the signup standing. Within a day of the address's last email, nothing is sent and the answer says so.
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
	const signup = signupOf(form)
	if (!signup) return 'invalid'
	let kind: ListEmail | undefined
	try {
		kind = await listEmailFor(bindings.list, signup)
	} catch (error) {
		logFailure('subscribe.failed', error)
		return 'failed'
	}
	if (!kind) return 'signed-up-today'
	bindings.defer(notify(bindings, signup.email, kind))
	return 'subscribed'
}
