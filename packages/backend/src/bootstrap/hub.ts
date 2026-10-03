import { randomUUID } from 'node:crypto'
import http from 'node:http'
import os from 'node:os'

import { createAccessGuard } from '../adapters/inbound/http/auth.js'
import {
	authoritiesFor,
	resolveBinding,
} from '../adapters/inbound/http/binding.js'
import { createHub } from '../adapters/inbound/http/hub.js'
import { listenOn } from '../adapters/inbound/http/listen.js'
import {
	DEFAULT_HOST,
	DEFAULT_HUB_PORT,
} from '../adapters/inbound/http/options.js'
import { createHubRequestHandler } from '../adapters/inbound/http/router.js'
import { routes } from '../adapters/inbound/http/routes.js'
import { hubLog } from '../adapters/outbound/console.js'
import { editorPort } from '../adapters/outbound/editor/open-editor.js'
import { nodeSettings } from '../adapters/outbound/filesystem/desk.js'
import { nodeHubRegistry } from '../adapters/outbound/filesystem/hub.js'
import { nodeReviewStore } from '../adapters/outbound/filesystem/persistence.js'
import { nodeGit } from '../adapters/outbound/git/repo.js'

import type { Hub } from '../adapters/inbound/http/hub.js'
import type { HubHandle, HubOptions } from '../adapters/inbound/http/options.js'

// Test seam: TTL for the ephemeral agent-activity line (default 90s).
const DEFAULT_STATUS_TTL_MS = 90_000

// Start the hub: bind it, wire its collaborators, restore the desks it hosted before, and hand
// back the URLs the caller prints (one for the reviewer's browser, one for the same-machine agent
// CLI). The origin guard, the access guard, the desk registry and the per-desk mutation mutexes
// all live behind this call. Binding a taken port rejects (EADDRINUSE) - the CLI decides what
// that means (a hub already running there is the normal case).
export async function startHub(options: HubOptions): Promise<HubHandle> {
	const host = options.host ?? DEFAULT_HOST
	const publicUrl = options.publicUrl ? new URL(options.publicUrl) : undefined
	const binding = resolveBinding(
		host,
		os.hostname(),
		options.allowedHosts ?? [],
		publicUrl?.host,
	)
	const guard = createAccessGuard(
		options.key,
		publicUrl?.protocol === 'https:',
	)
	const hub = createHub(
		{
			git: nodeGit,
			store: nodeReviewStore,
			settings: nodeSettings,
			editor: editorPort(options.runEditorCommand),
			registry: nodeHubRegistry,
			statusTtlMs: options.statusTtlMs ?? DEFAULT_STATUS_TTL_MS,
			log: options.log ?? hubLog,
		},
		randomUUID(),
	)
	const server = http.createServer()
	server.on(
		'request',
		createHubRequestHandler({
			hub,
			guard,
			// The origin guard re-reads the port per request: server.address() is populated
			// only once the socket is bound.
			authorities: () => authoritiesFor(binding, portOf(server)),
			deskRoutes: routes,
			version: options.version,
			keyRequired: guard.keyRequired,
			onShutdown: () => options.onShutdown?.(),
		}),
	)
	await listenOn(server, options.port ?? DEFAULT_HUB_PORT, host)
	await hub.restore()
	const port = portOf(server)
	return {
		server,
		hub,
		port,
		url: publicUrl?.href ?? `http://${binding.browserHost}:${port}/`,
		localUrl: `http://${binding.lockHost}:${port}/`,
		close: () => closeHub(server, hub),
	}
}

// Stop serving: parked long-polls are cut (an agent's `await` exits non-zero and re-checks the
// hub), the registry is written one last time so the next start restores the same desks.
async function closeHub(server: http.Server, hub: Hub): Promise<void> {
	server.closeAllConnections()
	await new Promise<void>(resolve => {
		server.close(() => resolve())
	})
	await hub.persist()
}

// The listening port. server.address() is only populated once the socket is bound, and the origin
// guard re-reads it per request, so it must stay a lookup rather than a captured value.
function portOf(server: http.Server): number {
	const address = server.address()
	return typeof address === 'object' && address ? address.port : 0
}
