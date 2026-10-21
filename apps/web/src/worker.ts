// The web's Worker (RFC 0001, phase 2): sign-in, pairing, the person's page shells and API, and the
// two sockets and the relay it hands to the person's UserHub object. The routes run in the
// security order (RFC 6.3, R9): what needs no session first, each refused before it reads more
// than it must (ops by its token before D1, pairing by its code or its token, the hub's socket by
// its token), then everything a session opens, the session read once before any object is
// touched. Nothing logs a request it answered: the one log line is an unexpected throw.
import { signInRoute } from './auth/magic-link.js'
import { fail, html, INTERNAL } from './http/answer.js'
import { isRead } from './http/call.js'
import { logFailure } from './http/log.js'
import { HTTP_NO_CONTENT, HTTP_NOT_FOUND } from './http/status.js'
import { notFoundPage } from './pages/not-found.js'
import { healthRoute } from './routes/health.js'
import { hubSocketRoute } from './routes/hub-socket.js'
import { sessionRoute } from './routes/session-routes.js'
import { shellRoute } from './routes/shells.js'

import type { Call, Route } from './http/call.js'

export { UserHub } from './bridge/user-hub.js'

const ROUTES: readonly Route[] = [
	// 1. Sign-in.
	signInRoute,
	// 2. The hub's socket, by its token.
	hubSocketRoute,
	// 3. The health probe, as a hub answers it.
	async call => healthRoute(call),
	// 4. Everything under /api/ a session opens.
	sessionRoute,
	// 5. The pages: a shell for a cookie, sign-in for none.
	shellRoute,
]

const NOT_FOUND = {
	status: HTTP_NOT_FOUND,
	code: 'NOT_FOUND',
	error: 'Nothing at this path.',
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const call: Call = {
			request,
			url: new URL(request.url),
			env,
			ctx,
			now: new Date(),
		}
		try {
			return (await answered(call, 0)) ?? notFound(call)
		} catch (error) {
			logFailure('unexpected', error)
			return fail(INTERNAL)
		}
	},
} satisfies ExportedHandler<Env>

// The first route that answers, in order.
async function answered(call: Call, index: number): Promise<Response | null> {
	const route = ROUTES[index]
	if (!route) return null
	return (await route(call)) ?? answered(call, index + 1)
}

// What no route answered: a page for a browser's navigation, the JSON failure for the rest.
function notFound({ request, url }: Call): Response {
	if (url.pathname === '/favicon.ico')
		return new Response(null, { status: HTTP_NO_CONTENT })
	const isNavigation =
		isRead(request) &&
		(request.headers.get('accept') ?? '').includes('text/html')
	if (isNavigation) return html(HTTP_NOT_FOUND, notFoundPage(url.pathname))
	return fail(NOT_FOUND)
}
