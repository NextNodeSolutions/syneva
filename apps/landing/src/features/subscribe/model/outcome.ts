// An address already on the list ends `subscribed` too, and the email it gets says it was already there. Within a day of its last email it gets none, and ends `signed-up-today` so the form says so instead.
const OUTCOMES = [
	'subscribed',
	'signed-up-today',
	'invalid',
	'limited',
	'failed',
] as const
export type Outcome = (typeof OUTCOMES)[number]

export const isOutcome = (answered: unknown): answered is Outcome =>
	OUTCOMES.some(outcome => outcome === answered)

export const OUTCOME_MESSAGE: Record<Outcome, string> = {
	subscribed:
		'You\u2019re on the launch list. One email, the day Syneva installs.',
	'signed-up-today': 'You already signed up today. Check your inbox.',
	invalid: 'That doesn\u2019t look like an email address.',
	limited: 'Too many tries from here. Give it a minute.',
	failed: 'That didn\u2019t go through. Try again in a moment.',
}

export const OUTCOME_STATUS: Record<Outcome, number> = {
	subscribed: 200,
	'signed-up-today': 200,
	invalid: 400,
	limited: 429,
	failed: 500,
}
