// How a signup ends: the endpoint answers it, the form tells it. An address
// already on the list ends `subscribed` too, so the answer never reveals who
// signed up.
const OUTCOMES = ['subscribed', 'invalid', 'limited', 'failed'] as const
export type Outcome = (typeof OUTCOMES)[number]

export const isOutcome = (answered: unknown): answered is Outcome =>
	OUTCOMES.some(outcome => outcome === answered)

export const OUTCOME_MESSAGE: Record<Outcome, string> = {
	subscribed:
		'You\u2019re on the list. I\u2019ll write when Syneva is ready.',
	invalid: 'That doesn\u2019t look like an email address.',
	limited: 'Too many tries from here. Give it a minute.',
	failed: 'That didn\u2019t go through. Try again in a moment.',
}

export const OUTCOME_STATUS: Record<Outcome, number> = {
	subscribed: 200,
	invalid: 400,
	limited: 429,
	failed: 500,
}
