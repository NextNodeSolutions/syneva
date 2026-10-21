import http from 'node:http'

import { authoritiesFor } from './binding.js'
import { failureOf } from './http.js'
import { nodeRequestListener } from './node-adapter.js'
import { createHubRouter } from './router.js'
import { routes } from './routes.js'
import { parkedRoutes } from './routes/await-send.js'

import type { Binding } from './binding.js'
import type { NodeUiMiddleware } from './node-adapter.js'
import type { HubRouterDeps } from './router.js'

export type LocalServerDeps = Omit<
	HubRouterDeps,
	'authorities' | 'deskRoutes'
> & {
	binding: Binding
	uiMiddleware?: NodeUiMiddleware | undefined
}

// The local hub's HTTP server: the hub's router on the Fetch API, under node:http through the
// Node adapter. node:http speaks plain HTTP: a TLS proxy in front of it (--public-url
// https://...) is outside this server, and no route reads the scheme.
export function createLocalServer(deps: LocalServerDeps): http.Server {
	const { binding, uiMiddleware, ...routerDeps } = deps
	const server = http.createServer()
	const router = createHubRouter({
		...routerDeps,
		// The origin guard re-reads the port per request: server.address() is populated only once the socket is bound.
		authorities: () => authoritiesFor(binding, portOf(server)),
		// The core desk routes, plus the one this server can serve because node:http holds a request open: the agent's parked await (routes/await-send.ts).
		deskRoutes: { ...routes, ...parkedRoutes },
	})
	server.on(
		'request',
		nodeRequestListener(router, {
			scheme: 'http',
			uiMiddleware,
			onError: failureOf,
		}),
	)
	return server
}

export function portOf(server: http.Server): number {
	const address = server.address()
	return typeof address === 'object' && address ? address.port : 0
}
