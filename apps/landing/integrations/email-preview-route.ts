import { renderWelcome } from '../src/features/subscribe/email/render-welcome.server'

import type { APIRoute } from 'astro'

export const prerender = false

const SAMPLE_RECIPIENT = 'you@example.com'

export const GET: APIRoute = ({ url }) => {
	const { html, text } = renderWelcome({
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
