import { answer } from '@features/subscribe/model/answer.server'
import { subscribe } from '@features/subscribe/model/subscribe.server'
import { sendWelcome } from '@features/subscribe/model/welcome.server'
import { env } from 'cloudflare:workers'

import type { APIRoute } from 'astro'

// The newsletter signup, the one route the Worker renders on demand: every
// other route prerenders into static assets.
export const prerender = false

export const POST: APIRoute = async ({ request, clientAddress }) => {
	const outcome = await subscribe(request, clientAddress, {
		list: env.DB,
		limiter: env.RL_SUBSCRIBE,
		welcome: email => sendWelcome(env.RESEND_API_KEY, email),
	})
	return answer(request, outcome)
}
