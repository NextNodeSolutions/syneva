// Signup forms: each [data-signup] posts its email without leaving the page
// and tells the outcome in its own status line. Without scripts the form
// posts natively and the endpoint answers with a navigation instead.
import { isOutcome, OUTCOME_MESSAGE } from './outcome'

import type { Outcome } from './outcome'

const SENDING = 'Sending…'
// The status line's tone, by the outcome it tells.
const DONE = 'is-done'
const ERROR = 'is-error'

// SignupForm.astro renders every part, so a missing one is a broken form.
const missing = (part: string): Error =>
	new Error(
		`A [data-signup] form has no ${part}: render it with SignupForm.astro.`,
	)

const outcomeOf = (body: unknown): Outcome =>
	typeof body === 'object' &&
	body !== null &&
	'outcome' in body &&
	isOutcome(body.outcome)
		? body.outcome
		: 'failed'

// A failure to reach the endpoint, or an answer it never gives, reads as one
// that did not go through.
async function post(form: HTMLFormElement): Promise<Outcome> {
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

function bindSignup(form: HTMLFormElement): void {
	const status = form.querySelector('[data-signup-status]')
	const submit = form.querySelector('button')
	const field = form.querySelector('input')
	if (!status) throw missing('status line ([data-signup-status])')
	if (!submit) throw missing('submit button')
	if (!field) throw missing('email field')
	const tell = (message: string, tone?: string): void => {
		status.classList.remove(DONE, ERROR)
		if (tone) status.classList.add(tone)
		status.textContent = message
	}
	const send = async (): Promise<void> => {
		submit.disabled = true
		form.setAttribute('aria-busy', 'true')
		tell(SENDING)
		const outcome = await post(form)
		submit.disabled = false
		form.removeAttribute('aria-busy')
		const isSubscribed = outcome === 'subscribed'
		tell(OUTCOME_MESSAGE[outcome], isSubscribed ? DONE : ERROR)
		if (isSubscribed) form.reset()
		else field.focus()
	}
	// The browser validates the address first; a submit only fires once it
	// accepted it.
	form.addEventListener('submit', event => {
		event.preventDefault()
		void send()
	})
}

export function bindSignups(): void {
	document
		.querySelectorAll<HTMLFormElement>('form[data-signup]')
		.forEach(bindSignup)
}
