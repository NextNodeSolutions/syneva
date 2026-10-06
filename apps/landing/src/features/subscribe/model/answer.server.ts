import { SUBSCRIBED_HREF } from './endpoint'
import { OUTCOME_MESSAGE, OUTCOME_STATUS } from './outcome'

import type { Outcome } from './outcome'

const SEE_OTHER = 303

const wantsJson = (request: Request): boolean =>
	request.headers.get('accept')?.includes('application/json') ?? false

// The script asks for JSON and shows the outcome in the status line; a no-JS post navigates: a signup lands on the home's confirmation, anything else reads its message as text.
export function answer(request: Request, outcome: Outcome): Response {
	const status = OUTCOME_STATUS[outcome]
	if (wantsJson(request)) return Response.json({ outcome }, { status })
	if (outcome === 'subscribed')
		return new Response(null, {
			status: SEE_OTHER,
			headers: { Location: SUBSCRIBED_HREF },
		})
	return new Response(OUTCOME_MESSAGE[outcome], {
		status,
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	})
}
