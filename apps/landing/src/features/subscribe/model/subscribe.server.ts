import { logFailure } from './log-failure.server'
import { isTrapped, readForm, signupOf } from './read-signup.server'

import type { Outcome } from './outcome'
import type { Signup } from './signup'

export type SignupBindings = {
	list: D1Database
	limiter: RateLimit
	welcome: (email: string) => Promise<void>
}

// The address keeps the case it was typed in; the column's NOCASE collation makes it unique regardless (migrations/0001_subscribers.sql).
// A second signup changes nothing, its details included: whoever knows an address cannot rewrite what its owner left.
const INSERT_SUBSCRIBER =
	'INSERT INTO subscribers (email, name, agents) VALUES (?1, ?2, ?3) ON CONFLICT (email) DO NOTHING'

async function addSubscriber(
	list: D1Database,
	{ email, name, agents }: Signup,
): Promise<boolean> {
	const { meta } = await list
		.prepare(INSERT_SUBSCRIBER)
		.bind(
			email,
			name || null,
			agents.length > 0 ? JSON.stringify(agents) : null,
		)
		.run()
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
	const signup = signupOf(form)
	if (!signup) return 'invalid'
	try {
		if (!(await addSubscriber(bindings.list, signup))) return 'subscribed'
	} catch (error) {
		logFailure('subscribe.failed', error)
		return 'failed'
	}
	try {
		await bindings.welcome(signup.email)
	} catch (error) {
		logFailure('subscribe.welcome-failed', error)
	}
	return 'subscribed'
}
