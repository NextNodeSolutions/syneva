import { renderEmail } from '../src/features/subscribe/email/render-email.server'
import {
	isListEmail,
	LIST_EMAILS,
} from '../src/features/subscribe/model/list-email'

import type { APIRoute } from 'astro'

export const prerender = false

const SAMPLE_RECIPIENT = 'you@example.com'
const NOT_FOUND = 404

export const GET: APIRoute = ({ params, url }) => {
	const { kind } = params
	if (!kind || !isListEmail(kind))
		return new Response(
			`No list email "${kind ?? ''}": preview one of ${LIST_EMAILS.map(listEmail => `/_email/${listEmail}`).join(', ')}.`,
			{ status: NOT_FOUND },
		)
	const { html, text } = renderEmail(kind, {
		recipient: SAMPLE_RECIPIENT,
		origin: url.origin,
	})
	const isText = url.searchParams.has('text')
	return new Response(isText ? text : html, {
		headers: {
			'Content-Type': `${isText ? 'text/plain' : 'text/html'}; charset=utf-8`,
		},
	})
}
