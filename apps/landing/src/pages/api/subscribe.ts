import { answer } from '@features/subscribe/model/answer.server'
import { sendListEmail } from '@features/subscribe/model/send-list-email.server'
import { subscribe } from '@features/subscribe/model/subscribe.server'
import { env, waitUntil } from 'cloudflare:workers'

import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request, clientAddress }) => {
	const outcome = await subscribe(request, clientAddress, {
		list: env.DB,
		limiter: env.RL_SUBSCRIBE,
		send: (to, kind) =>
			sendListEmail(
				{ apiKey: env.RESEND_API_KEY, origin: env.SITE_URL },
				to,
				kind,
			),
		defer: waitUntil,
	})
	return answer(request, outcome)
}
