import http from 'node:http'

import { authoritiesFor } from '@syneva/core/http/binding'
import { failureOf } from '@syneva/core/http/http'
import { createHubRouter, upgradeRefusal } from '@syneva/core/http/router'
import { routes } from '@syneva/core/http/routes'

import { nodeRequestListener } from './node-adapter.js'
import { parkedRoutes } from './routes/await-send.js'
import { createHubSocket, isHubSocketRequest } from './stream/hub-socket.js'

import type { HubIdentity } from '@syneva/contracts/bridge'
import type { Binding } from '@syneva/core/http/binding'
import type { HubRouterDeps } from '@syneva/core/http/router'
import type { NodeUiMiddleware } from './node-adapter.js'
import type { HubSocket } from './stream/hub-socket.js'

export type LocalServerDeps = Omit<
	HubRouterDeps,
	'authorities' | 'deskRoutes'
> & {
	binding: Binding
	uiMiddleware?: NodeUiMiddleware | undefined
	// Who the hub's stream says it is (its `hello`).
	identity: HubIdentity
	log: (line: string) => void
}

export type LocalServer = {
	server: http.Server
	// The hub's stream (GET /api/hub/ws), closed before the server on shutdown.
	stream: HubSocket
}

// The local hub's HTTP server: the hub's router on the Fetch API, under node:http through the
// Node adapter, and its stream on the server's 'upgrade' event behind the same guards.
// node:http speaks plain HTTP: a TLS proxy in front of it (--public-url https://...) is outside
// this server, and no route reads the scheme.
export function createLocalServer(deps: LocalServerDeps): LocalServer {
	const { binding, uiMiddleware, identity, log, ...routerDeps } = deps
	const server = http.createServer({
		shouldUpgradeCallback: isHubSocketRequest,
	})
	const guards = {
		// The origin guard re-reads the port per request: server.address() is populated only once the socket is bound.
		authorities: () => authoritiesFor(binding, portOf(server)),
		guard: routerDeps.guard,
	}
	const router = createHubRouter({
		...routerDeps,
		authorities: guards.authorities,
		// The core desk routes, plus the one this server can serve because node:http holds a request open: the agent's parked await (routes/await-send.ts).
		deskRoutes: { ...routes, ...parkedRoutes },
	})
	const stream = createHubSocket({
		source: {
			identity,
			hub: deps.hub,
			journal: deps.journal,
			plans: deps.plans,
		},
		log,
		refusal: request => upgradeRefusal(guards, request),
	})
	server.on('upgrade', stream.upgrade)
	server.on(
		'request',
		nodeRequestListener(router, {
			scheme: 'http',
			uiMiddleware,
			onError: failureOf,
		}),
	)
	return { server, stream }
}

export function portOf(server: http.Server): number {
	const address = server.address()
	return typeof address === 'object' && address ? address.port : 0
}
