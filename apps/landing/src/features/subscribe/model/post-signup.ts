import { isOutcome } from './outcome'

import type { Outcome } from './outcome'

const outcomeOf = (body: unknown): Outcome =>
	typeof body === 'object' &&
	body !== null &&
	'outcome' in body &&
	isOutcome(body.outcome)
		? body.outcome
		: 'failed'

// Posts the form as it stands, so the script and a post without scripts send the same fields; any network or decoding failure reads as `failed`.
export async function postSignup(form: HTMLFormElement): Promise<Outcome> {
	try {
		const response = await fetch(form.action, {
			method: 'POST',
			body: new FormData(form),
			headers: { Accept: 'application/json' },
		})
		return outcomeOf(await response.json())
	} catch {
		return 'failed'
	}
}
